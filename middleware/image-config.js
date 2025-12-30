import sharp from "sharp";

export async function processUserImage(file, userId) {
    const uploadPath = `./public/assets/images/profile/user/${userId}.jpg`

    await sharp(file.data)
        .resize(256, 256, { fit: "cover", position: "center" })
        .jpeg({ quality: 80 })
        .toFile(uploadPath);
}