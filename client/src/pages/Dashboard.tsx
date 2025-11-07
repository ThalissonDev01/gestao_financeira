import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, CreditCard } from "lucide-react";
import { useMemo } from "react";

export default function Dashboard() {
  const { data: accounts = [] } = trpc.accounts.list.useQuery();
  const { data: transactions = [] } = trpc.transactions.list.useQuery();
  const { data: payables = [] } = trpc.payables.list.useQuery();
  const { data: receivables = [] } = trpc.receivables.list.useQuery();

  const stats = useMemo(() => {
    const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || "0"), 0);
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const pendingPayables = payables
      .filter((p) => p.status === "pending" || p.status === "overdue")
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const pendingReceivables = receivables
      .filter((r) => r.status === "pending" || r.status === "overdue")
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);

    return {
      totalBalance,
      totalIncome,
      totalExpense,
      pendingPayables,
      pendingReceivables,
      netFlow: totalIncome - totalExpense,
    };
  }, [accounts, transactions, payables, receivables]);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    description,
  }: {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
    description?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>{Icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Saldo Total"
          value={formatCurrency(stats.totalBalance)}
          icon={<DollarSign className="w-5 h-5 text-white" />}
          color="bg-blue-500"
          description={`${accounts.length} conta(s) ativa(s)`}
        />
        <StatCard
          title="Receitas (Mês)"
          value={formatCurrency(stats.totalIncome)}
          icon={<TrendingUp className="w-5 h-5 text-white" />}
          color="bg-green-500"
          description={`${transactions.filter((t) => t.type === "income").length} transação(ões)`}
        />
        <StatCard
          title="Despesas (Mês)"
          value={formatCurrency(stats.totalExpense)}
          icon={<TrendingDown className="w-5 h-5 text-white" />}
          color="bg-red-500"
          description={`${transactions.filter((t) => t.type === "expense").length} transação(ões)`}
        />
        <StatCard
          title="Fluxo Líquido"
          value={formatCurrency(stats.netFlow)}
          icon={<CreditCard className="w-5 h-5 text-white" />}
          color={stats.netFlow >= 0 ? "bg-emerald-500" : "bg-orange-500"}
          description={stats.netFlow >= 0 ? "Resultado positivo" : "Resultado negativo"}
        />
        <StatCard
          title="Contas a Pagar"
          value={formatCurrency(stats.pendingPayables)}
          icon={<TrendingDown className="w-5 h-5 text-white" />}
          color="bg-yellow-500"
          description={`${payables.filter((p) => p.status === "pending" || p.status === "overdue").length} pendente(s)`}
        />
        <StatCard
          title="Contas a Receber"
          value={formatCurrency(stats.pendingReceivables)}
          icon={<TrendingUp className="w-5 h-5 text-white" />}
          color="bg-purple-500"
          description={`${receivables.filter((r) => r.status === "pending" || r.status === "overdue").length} pendente(s)`}
        />
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>Últimas movimentações</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma transação registrada ainda
            </p>
          ) : (
            <div className="space-y-4">
              {transactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-accent rounded-lg"
                >
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.transactionDate).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <p
                    className={`font-semibold ${
                      transaction.type === "income" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(parseFloat(transaction.amount))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
