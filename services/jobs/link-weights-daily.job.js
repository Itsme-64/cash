import Link from '../../models/links.js';
import ClickEvent from '../../models/click-event.js';
import LinkStatsDaily from '../../models/link-stats-daily.js';
import { calculateCountryMultiplier } from '../apply-revenue-period.js'

export async function linkWeightsDaily() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const linkStats = await LinkStatsDaily.find({ date: yesterday });

    for (const linkStat of linkStats) {
        const link = await Link.findById(linkStat.link);

        const clickWeight = calculateLinkClickWeight(link, yesterday);
        linkStat.clickWeight = clickWeight;
        await linkStat.save();
    }

    return;
}

/**
 * Adapted *calculateLinkTotalWeight* from '../apply-revenue-period.js'
 */
async function calculateLinkClickWeight(link, yesterday) {
    const start = new Date(yesterday);
    const end = new Date(yesterday);
    end.setHours(23, 59, 59, 999);

    const clickEvents = await ClickEvent.find({ link: link._id, createdAt: { $gte: start, $lte: end }, valid: true });
    const baseWeight = link.weight;
    if (baseWeight == 0) return 0;
    let linkWeight = 0;

    const ips = clickEvents.map(c => c.ip);
    const ipRatio = new Set(ips).size / (ips.length + 1);

    clickEvents.forEach(clickEvent => {
        linkWeight += baseWeight * Math.pow(ipRatio, 0.25) * calculateCountryMultiplier(clickEvent.country);
    });

    if (clickEvents.length == 0) return 0
    return Math.round(linkWeight / clickEvents.length);
}