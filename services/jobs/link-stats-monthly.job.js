import LinkStatsDaily from "../../models/link-stats-daily.js";
import LinkStatsMonthly from '../../models/link-stats-monthly.js';

export async function linksStatsMonthly() {
    const now = new Date();
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    
    const linkStatsAgg = await LinkStatsDaily.aggregate([
        { $match: { date: { $gte: startLastMonth, $lte: endLastMonth } } },
        { $group: { _id: '$link', totalClicks: { $sum: { $ifNull: ['$clicks', 0] } } } },
        { $match: { totalClicks: { $gt: 0 } } }
    ]);

    await LinkStatsMonthly.insertMany(
        linkStatsAgg.map(stat => ({
            link: stat._id,
            date: startLastMonth,
            clicks: stat.totalClicks
        }))
    );

    await LinkStatsDaily.deleteMany({ date: { $lte: startLastMonth } });

    return;
}