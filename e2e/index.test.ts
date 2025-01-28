import { Server } from '@hapi/hapi'
import { initializeServer } from '../src/server'
import KnexDatabase from '../src/server/KnexDatabase'

describe('E2E Tests', () => {
    let server: Server
    type Item = {
        id: number
        name: string
        price: number
    }

    beforeEach(async () => {
        server = await initializeServer()
    })

    it('should get a response with status code 200', async () => {
        await server.inject({
            method: 'GET',
            url: '/ping'
        })
            .then(response => {
                expect(response.statusCode).toBe(200)
                expect(response.result).toEqual({ ok: true })
            })
    });

    describe("Basic Items functionality", () => {
        it("should be able to list all items", async () => {
            const response = await server.inject({
                method: 'GET',
                url: '/items'
            })
            expect(response.statusCode).toBe(200)
            expect(response.result).toEqual([])

            await server.inject({
                method: 'POST',
                url: '/items',
                payload: {
                    name: 'Item 1',
                    price: 10
                }
            })

            const response2 = await server.inject({
                method: 'GET',
                url: '/items'
            })
            expect(response2.statusCode).toBe(200)
            expect(response2.result).toEqual([{
                id: expect.any(Number),
                name: 'Item 1',
                price: 10
            }])
        })

        it("should be able to create a new item and get it by id", async () => {
            const response = await server.inject<Item>({
                method: 'POST',
                url: '/items',
                payload: {
                    name: 'Item 1',
                    price: 10
                }
            })
            expect(response.statusCode).toBe(201)
            expect(response.result).toEqual({
                id: expect.any(Number),
                name: 'Item 1',
                price: 10
            })

            const response2 = await server.inject({
                method: 'GET',
                url: `/items/${response.result!.id}`
            })

            expect(response2.statusCode).toBe(200)
            expect(response2.result).toEqual({
                id: expect.any(Number),
                name: 'Item 1',
                price: 10
            })
        })

        it("should be able to update an item", async () => {
            const { result: createdItem } = await server.inject<Item>({
                method: 'POST',
                url: '/items',
                payload: {
                    name: 'Item 1',
                    price: 10
                }
            })

            expect(createdItem).toBeDefined()

            const response = await server.inject({
                method: 'PUT',
                url: `/items/${createdItem!.id}`,
                payload: {
                    name: 'Item 1 updated',
                    price: 20
                }
            })
            expect(response.statusCode).toBe(200)
            expect(response.result).toEqual({
                id: createdItem!.id,
                name: 'Item 1 updated',
                price: 20
            })

            const response2 = await server.inject({
                method: 'GET',
                url: `/items/${createdItem!.id}`
            })
            expect(response2.statusCode).toBe(200)
            expect(response2.result).toEqual({
                id: createdItem!.id,
                name: 'Item 1 updated',
                price: 20
            })
        })

        it("should be able to delete an item", async () => {
            const { result: createdItem } = await server.inject<Item>({
                method: 'POST',
                url: '/items',
                payload: {
                    name: 'Item 1',
                    price: 10
                }
            })

            expect(createdItem).toBeDefined()

            const response = await server.inject({
                method: 'DELETE',
                url: `/items/${createdItem!.id}`
            })
            expect(response.statusCode).toBe(204)

            const response2 = await server.inject({
                method: 'GET',
                url: `/items/${createdItem!.id}`
            })

            expect(response2.statusCode).toBe(404)
        })
    })

    describe("Validations", () => {

        it("should validate required fields", async () => {

            const response = await server.inject({
                method: 'POST',
                url: '/items',
                payload: {
                    name: 'Item 1'
                }
            })

            expect(response.statusCode).toBe(400)
            expect(response.result).toEqual({
                errors: [
                    {
                        field: 'price',
                        message: 'Field "price" is required'
                    }
                ]
            })

        })

        it("should not allow for negative pricing for new items", async () => {
            const response = await server.inject({
                method: 'POST',
                url: '/items',
                payload: {
                    name: 'Item 1',
                    price: -10
                }
            })

            expect(response.statusCode).toBe(400)
            expect(response.result).toEqual({
                errors: [
                    {
                        field: 'price',
                        message: 'Field "price" cannot be negative'
                    }
                ]
            })
        })

        it("should not allow for negative pricing for updated items", async () => {
            const { result: createdItem } = await server.inject<Item>({
                method: 'POST',
                url: '/items',
                payload: {
                    name: 'Item 1',
                    price: 10
                }
            })

            expect(createdItem).toBeDefined()

            const response = await server.inject({
                method: 'PUT',
                url: `/items/${createdItem!.id}`,
                payload: {
                    name: 'Item 1 updated',
                    price: -20
                }
            })

            expect(response.statusCode).toBe(400)
            expect(response.result).toEqual({
                errors: [
                    {
                        field: 'price',
                        message: 'Field "price" cannot be negative'
                    }
                ]
            })
        })
    })

    afterAll(() => {
        KnexDatabase.destroy();
        return server.stop()
    })
})