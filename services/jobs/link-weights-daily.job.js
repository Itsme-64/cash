import Link from '../../models/links.js';
import ClickEvent from '../../models/click-event.js';
import LinkStatsDaily from '../../models/link-stats-daily.js';
import { calculateCountryMultiplier } from '../apply-revenue-period.js'

export async function linkWeightsDaily() {
    const yesterdayStart = new Date();
    yesterdayStart.setHours(0, 0, 0, 0);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const yesterdayEnd = new Date(yesterdayStart);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const linkStatsAgg = await ClickEvent.aggregate([
        { $match: { valid: true, createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd } } },
        { $group: { _id: "$link", totalClicks: { $sum: 1 }, ips: { $addToSet: "$ip" }, countries: { $push: "$country" } } }
    ]);

    const linkStatsDaily = await LinkStatsDaily.find({ date: yesterdayStart }).lean();
    const linkMap = Object.fromEntries(linkStatsDaily.map(ls => [String(ls.link), ls]));

    const links = await Link.find({
        _id: { $in: linkStatsAgg.map(a => a._id) }
    }).lean();

    for (const link of links) {
        const agg = linkStatsAgg.find(a => String(a._id) === String(link._id));
        if (!agg || link.weight === 0) continue;

        const uniqueIps = agg.ips.filter(ip => ip !== "unknown").length;
        const totalClicks = agg.totalClicks;

        const ipRatio = uniqueIps / (totalClicks + 1);
        const ipFactor = Math.pow(ipRatio, 0.25);

        let weightedSum = 0;
        agg.countries.forEach(country => {
            weightedSum += calculateCountryMultiplier(country);
        });

        const clickWeight = Math.round(link.weight * ipFactor * weightedSum / totalClicks);

        const stat = linkMap[String(link._id)];
        if (stat) {
            stat.clickWeight = clickWeight;
            await LinkStatsDaily.updateOne({ _id: stat._id }, { $set: { clickWeight } });
        }
    }
}