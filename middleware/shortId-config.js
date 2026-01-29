import shortId from 'shortid';
import Link from '../models/links.js';

export async function shortIdValidation(data) {
    let tries = 0;
    while (true) {
        try {
            return await Link.create({
                ...data,
                short: shortId.generate()
            });
        } catch (err) {
            if (err.code !== 11000) throw err;
            tries++;
            if (tries > 5) throw new Error('Could not generate unique short ID');
        }
    }
}