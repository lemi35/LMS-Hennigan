import { Document, Model } from "mongoose"

interface MonthData {
    month: string;
    count: number;
}

export async function generateLast12MonthData<T extends Document>(
  model: Model<T>
): Promise<{ last12Months: MonthData[] }> {

  const last12Months: MonthData[] = [];
  const currentDate = new Date();

  for (let i = 11; i >= 0; i--) {

    // Get first day of the month
    const startDate = new Date(
      currentDate.getFullYear(), //return current year as a number
      currentDate.getMonth() - i, //return current month as a number (0-11) and subtract i to get previous months
      1
    );

    // Get first day of next month
    const endDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - i + 1,
      1
    );

    // Format month name (Jan 2026)
    const monthYear = startDate.toLocaleString("default", {
      month: "short",
      year: "numeric",
    });

    // Count documents created in that month
    const count = await model.countDocuments({
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    last12Months.push({
      month: monthYear,
      count,
    });
  }

  return { last12Months };
}