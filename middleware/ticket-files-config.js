import fs from "fs";
import sharp from "sharp";

export async function processTicketFiles(files, ticketId) {
    const uploadPath = `./public/assets/tickets/${ticketId}`
    await fs.promises.mkdir(uploadPath, { recursive: true });

    const fileArray = Array.isArray(files) ? files : [files]
    let Imageindex = 0
    let documentIndex = 0

    for (const file of fileArray) {
        if (file.mimetype.startsWith("image/")) {
            const outPath = `${uploadPath}/${ticketId}-image-0${Imageindex}.jpg`

            await sharp(file.data)
                .resize(1024, 1024, { fit: "inside" })
                .jpeg({ quality: 80 })
                .toFile(outPath)

            Imageindex++
        } else if (file.mimetype === "application/pdf") {
            const outPath = `${uploadPath}/${ticketId}-document-0${documentIndex}.pdf`
            await new Promise((resolve, reject) => {
            file.mv(outPath, (err) => (err ? reject(err) : resolve()));
            });

            documentIndex++
        }
    }

    return documentIndex + Imageindex;
}