import ffmpegStatic from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from 'stream';
import { WritableStreamBuffer } from 'stream-buffers';

// Configura la ruta de ffmpeg (si usas ffmpeg-static)
ffmpeg.setFfmpegPath(ffmpegStatic);

/**
 * Remueve el prefijo de Data URL en caso de existir.
 * @param base64Data Cadena base64 que podría incluir el prefijo.
 * @returns Cadena base64 limpia.
 */
function cleanBase64Data(base64Data: string): string {
    const regex = /^data:.*;base64,/;
    return base64Data.replace(regex, '');
}

/**
 * Convierte una data de audio (en base64 y con cualquier mimetype) a OGG usando el códec Opus.
 * @param base64Data La data original en base64.
 * @param inputMimeType El mimetype original (por ejemplo, "audio/mp3", "audio/wav", etc.)
 * @returns Una promesa que resuelve con la data convertida en base64.
 */
export async function convertToOggOpus(inputMimeType: string, base64Data: string,): Promise<string> {
    return new Promise((resolve, reject) => {
        // Limpia la cadena base64 (quita el prefijo de Data URL si lo tiene)
        const cleanedBase64 = cleanBase64Data(base64Data);

        // Convertimos la data base64 a un Buffer
        const inputBuffer = Buffer.from(cleanedBase64, 'base64');
        if (inputBuffer.length === 0) {
            return reject(new Error("El buffer de entrada está vacío. Verifica la cadena base64."));
        }
        // Creamos un stream de lectura a partir del Buffer
        const inputStream = new PassThrough();
        inputStream.end(inputBuffer);

        // Creamos un stream de escritura para capturar la salida de FFmpeg
        const outputBufferStream = new WritableStreamBuffer();

        // Mapeo de mimetype a formato para FFmpeg
        const formatMap: { [key: string]: string } = {
            'audio/mp3': 'mp3',
            'audio/mpeg': 'mp3',
            'audio/wav': 'wav',
            'audio/x-wav': 'wav',
            // Agrega otros formatos si es necesario
        };

        const command = ffmpeg(inputStream)
            .audioCodec('libopus') // Usamos el códec Opus
            .format('ogg');         // Contenedor OGG

        // Si se conoce el formato de entrada, se lo especificamos a FFmpeg
        if (formatMap[inputMimeType]) {
            command.inputFormat(formatMap[inputMimeType]);
        }

        command
            .on('error', (err) => {
                reject(new Error(`Error en la conversión con FFmpeg: ${err.message}`));
            })
            .on('end', () => {
                const outputBuffer = outputBufferStream.getContents();
                if (!outputBuffer) {
                    return reject(new Error('No se obtuvo resultado de la conversión.'));
                }
                resolve(outputBuffer.toString('base64'));
            })
            .pipe(outputBufferStream, { end: true });
    });
}
