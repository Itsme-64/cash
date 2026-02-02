import ClickEvent from "../../models/click-event.js";

export async function deleteInvalidClickEvents() {
    ClickEvent.deleteMany({ valid: false, createdAt: { $lt: new Date(Date.now() - 8 * 60 * 1000) } }); // 8 minutes
}