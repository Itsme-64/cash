import Link from '../../models/links.js';
import LinkStatsDaily from "../../models/link-stats-daily.js";
import LinkStatsMonthly from '../../models/link-stats-monthly.js';

export async function linksStatsMonthly() {
    const links = await Link.find()

    const now = new Date();
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    for (const link of links) {
        const linkStats = await LinkStatsDaily.find({ link: link._id, date: { $gte: startLastMonth, $lte: endLastMonth } })
        if (linkStats.length === 0) continue;

        const clicks = linkStats.reduce((sum, l) => sum + (l.clicks || 0), 0)
        if (!clicks || clicks == 0) continue;

        await LinkStatsMonthly.create({
            link: link._id,
            date: startLastMonth,
            clicks: clicks
        });
    }

    await LinkStatsDaily.deleteMany({ date: { $lte: startLastMonth } });

    return;
}