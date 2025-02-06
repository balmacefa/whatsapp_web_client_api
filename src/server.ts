import cors from 'cors';
import express from 'express';
import { readFileSync } from "fs";
import path from 'path';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { defineRoutes } from './api/routes';
import { ENV } from './server/global_variables';



const executionPath = process.cwd();
const packageJsonPath = path.join(executionPath, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

const swaggerOptions: swaggerJSDoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de WhatsApp Client',
            version: packageJson.version,
            description: 'Documentación de la API para gestionar clientes de WhatsApp',
        },
        servers: [{ url: ENV.PROD_HOST }],
        tags: [
            { name: 'clients', description: 'Client operations' },
            { name: 'messages', description: 'Message operations' },
            { name: 'media', description: 'Media operations' },
            { name: 'qr', description: 'QR code operations' },
        ],
    },
    apis: ['./src/api/routes.*'], // Path to the API routes
};

export const createApp = async () => {
    const app = express();

    // Middleware
    app.use(cors());
    // Middleware
    app.use(cors());
    // Aumentamos el límite de la petición para JSON y urlencoded
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));

    // Swagger setup
    const swaggerSpec = swaggerJSDoc(swaggerOptions);
    app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


    app.get('/', (req, res) => {
        res.send(
            `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Business API - Soluciones para PyMEs</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        .hero-section {
            background: linear-gradient(45deg, #25D366, #128C7E);
            color: white;
            padding: 100px 0;
        }
        .pricing-card {
            transition: transform 0.3s;
        }
        .pricing-card:hover {
            transform: translateY(-10px);
        }
        .feature-icon {
            font-size: 2.5rem;
            color: #128C7E;
        }
        .nav-link.active {
            border-bottom: 3px solid #25D366;
        }
    </style>
</head>
<body>
    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg navbar-light bg-light sticky-top">
        <div class="container">
            <a class="navbar-brand" href="#">WA API Solutions</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item"><a class="nav-link active" href="#features">Características</a></li>
                    <li class="nav-item"><a class="nav-link" href="#pricing">Precios</a></li>
                    <li class="nav-item"><a class="nav-link" href="#opensource">Open Source</a></li>
                    <li class="nav-item"><a class="nav-link" href="#contact">Contacto</a></li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero-section text-center">
        <div class="container">
            <h1 class="display-4 mb-4">Potencia tu WhatsApp Business</h1>
            <p class="lead">Version: ${packageJson.version}</p>
            <p class="lead mb-4">API para gestión de clientes, automatización e integraciones avanzadas</p>
            <div class="d-flex justify-content-center gap-3">
                <a href="#opensource" class="btn btn-outline-light btn-lg">Versión Open Source</a>
                <a href="#pricing" class="btn btn-light btn-lg">Planes Premium</a>
            </div>
        </div>
    </section>

    <!-- Features -->
    <section id="features" class="py-5">
        <div class="container">
            <h2 class="text-center mb-5">Características Principales</h2>
            <div class="row g-4">
                <div class="col-md-4">
                    <div class="card h-100 text-center p-3">
                        <i class="fas fa-comments feature-icon mb-3"></i>
                        <h4>Envío de Mensajes</h4>
                        <p>Texto, multimedia y mensajes de voz</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card h-100 text-center p-3">
                        <i class="fas fa-robot feature-icon mb-3"></i>
                        <h4>Integración n8n</h4>
                        <p>Automatización e IA con flujos personalizados</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card h-100 text-center p-3">
                        <i class="fas fa-code feature-icon mb-3"></i>
                        <h4>API RESTful</h4>
                        <p>Webhooks y API Key para integraciones</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Pricing -->
    <section id="pricing" class="py-5 bg-light">
        <div class="container">
            <h2 class="text-center mb-5">Planes y Precios</h2>
            <div class="row g-4">
                <!-- Open Source -->
                <div class="col-lg-4">
                    <div class="card pricing-card h-100">
                        <div class="card-body text-center">
                            <h4>Open Source</h4>
                            <div class="display-5 my-4">Gratis</div>
                            <ul class="list-unstyled">
                                <li class="mb-3">API Básica</li>
                                <li class="mb-3">Autohospedado</li>
                                <li class="mb-3">Comunidad GitHub</li>
                            </ul>
                            <a href="#opensource" class="btn btn-outline-primary">Ver repositorio</a>
                        </div>
                    </div>
                </div>
                
                <!-- Premium -->
                <div class="col-lg-4">
                    <div class="card pricing-card h-100 border-primary">
                        <div class="card-body text-center">
                            <h4>Premium</h4>
                            <div class="display-5 my-4">$99<span class="text-muted">/mes</span></div>
                            <ul class="list-unstyled">
                                <li class="mb-3">5 números registrados</li>
                                <li class="mb-3">Soporte prioritario</li>
                                <li class="mb-3">n8n Cloud</li>
                                <li class="mb-3">API Key incluida</li>
                            </ul>
                            <a href="#contact" class="btn btn-primary">Contratar</a>
                        </div>
                    </div>
                </div>

                <!-- Enterprise -->
                <div class="col-lg-4">
                    <div class="card pricing-card h-100">
                        <div class="card-body text-center">
                            <h4>Enterprise</h4>
                            <div class="display-5 my-4">Personalizado</div>
                            <ul class="list-unstyled">
                                <li class="mb-3">Números ilimitados</li>
                                <li class="mb-3">Soporte 24/7</li>
                                <li class="mb-3">Servidor dedicado</li>
                                <li class="mb-3">Integración personalizada</li>
                            </ul>
                            <a href="#contact" class="btn btn-outline-primary">Contactar</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Open Source Section -->
    <section id="opensource" class="py-5">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-md-6">
                    <h2>Versión Open Source</h2>
                    <p class="lead">Implementa tu propia solución con nuestro código abierto:</p>
                    <ul>
                        <li>GitHub Repository disponible</li>
                        <li>Documentación completa</li>
                        <li>Comunidad de soporte</li>
                    </ul>
                    <a href="https://github.com/tu-usuario/repositorio" class="btn btn-dark" target="_blank">
                        <i class="fab fa-github"></i> Ver en GitHub
                    </a>
                </div>
                <div class="col-md-6">
                    <img src="https://via.placeholder.com/500x300" alt="Open Source" class="img-fluid rounded">
                </div>
            </div>
        </div>
    </section>

    <!-- Contact -->
    <section id="contact" class="py-5 bg-light">
        <div class="container text-center">
            <h2 class="mb-4">¿Listo para comenzar?</h2>
            <p class="mb-4">Contáctanos por WhatsApp para más información</p>
            <a href="https://wa.me/1234567890" class="btn btn-success btn-lg" target="_blank">
                <i class="fab fa-whatsapp"></i> Contactar por WhatsApp
            </a>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-dark text-white py-4">
        <div class="container text-center">
            <p class="mb-0">&copy; 2023 WA API Solutions. Todos los derechos reservados.</p>
        </div>
    </footer>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // Smooth scrolling
        $(document).ready(function(){
            $('a[href^="#"]').on('click', function(e) {
                e.preventDefault();
                let target = this.hash;
                $('html, body').animate({
                    scrollTop: $(target).offset().top
                }, 800);
            });

            // Update nav link active state
            $(window).scroll(function() {
                let scrollPos = $(document).scrollTop();
                $('nav a').each(function() {
                    let currLink = $(this);
                    let refElement = $(currLink.attr("href"));
                    if (refElement.position().top <= scrollPos && refElement.position().top + refElement.height() > scrollPos) {
                        $('nav a').removeClass("active");
                        currLink.addClass("active");
                    }
                });
            });
        });
    </script>
</body>
</html>


        `);
    });


    // Define routes
    defineRoutes(app);

    return app;
};

export const startServer = async () => {
    const app = await createApp();
    const server = app.listen(ENV.PORT, () => {
        console.log(`Server running on http://${ENV.HOST}:${ENV.PORT}`);
        ENV.server_isReady = true;
        ENV.server_isHealthy = true;
    });

    return server;
};