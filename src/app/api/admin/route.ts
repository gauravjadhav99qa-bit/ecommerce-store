import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalOrders,
      totalRevenue,
      totalProducts,
      totalUsers,
      recentOrders,
      todayOrders,
      todayRevenue,
      pendingOrders,
      topProducts,
      ordersByStatus,
      revenueByDay,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: "CANCELLED" } } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true, phone: true } }, items: true },
      }),
      prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: todayStart }, status: { not: "CANCELLED" } },
      }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true, price: true },
        _count: { id: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      (async () => {
        const days: { date: string; revenue: number; orders: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
          const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);
          const [rev, count] = await Promise.all([
            prisma.order.aggregate({
              _sum: { total: true },
              where: { createdAt: { gte: dayStart, lt: dayEnd }, status: { not: "CANCELLED" } },
            }),
            prisma.order.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
          ]);
          days.push({
            date: dayStart.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
            revenue: rev._sum.total || 0,
            orders: count,
          });
        }
        return days;
      })(),
    ]);

    const topProductsWithNames = await Promise.all(
      topProducts.map(async (tp) => {
        const product = await prisma.product.findUnique({
          where: { id: tp.productId },
          select: { name: true, images: true, price: true },
        });
        return { ...tp, product };
      })
    );

    return NextResponse.json({
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      totalProducts,
      totalUsers,
      recentOrders,
      todayOrders,
      todayRevenue: todayRevenue._sum.total || 0,
      pendingOrders,
      topProducts: topProductsWithNames,
      ordersByStatus,
      revenueByDay,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
