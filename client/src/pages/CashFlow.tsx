import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

export default function CashFlow() {
  const { data: transactions = [] } = trpc.transactions.list.useQuery();
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  const filteredTransactions = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return transactions.filter((t) => {
      const tDate = new Date(t.transactionDate);
      return tDate >= start && tDate <= end;
    });
  }, [transactions, startDate, endDate]);

  // Agrupar por data
  const groupedByDate = useMemo(() => {
    const grouped: Record<string, typeof filteredTransactions> = {};

    filteredTransactions.forEach((t) => {
      const dateKey = new Date(t.transactionDate).toLocaleDateString("pt-BR");
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(t);
    });

    return Object.entries(grouped)
      .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime());
  }, [filteredTransactions]);

  // Calcular resumo
  const summary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let runningBalance = 0;

    filteredTransactions.forEach((t) => {
      const amount = parseFloat(t.amount);
      if (t.type === "income") {
        totalIncome += amount;
        runningBalance += amount;
      } else {
        totalExpense += amount;
        runningBalance -= amount;
      }
    });

    return {
      totalIncome,
      totalExpense,
      netFlow: totalIncome - totalExpense,
      runningBalance,
    };
  }, [filteredTransactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
  }: {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>{Icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Fluxo de Caixa</h2>
        <p className="text-muted-foreground">Acompanhe o movimento de entrada e saída de recursos</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Data Inicial</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Data Final</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Receitas"
          value={formatCurrency(summary.totalIncome)}
          icon={<TrendingUp className="w-5 h-5 text-white" />}
          color="bg-green-500"
        />
        <StatCard
          title="Despesas"
          value={formatCurrency(summary.totalExpense)}
          icon={<TrendingDown className="w-5 h-5 text-white" />}
          color="bg-red-500"
        />
        <StatCard
          title="Fluxo Líquido"
          value={formatCurrency(summary.netFlow)}
          icon={<DollarSign className="w-5 h-5 text-white" />}
          color={summary.netFlow >= 0 ? "bg-emerald-500" : "bg-orange-500"}
        />
        <StatCard
          title="Saldo"
          value={formatCurrency(summary.runningBalance)}
          icon={<DollarSign className="w-5 h-5 text-white" />}
          color="bg-blue-500"
        />
      </div>

      {/* Transações por Data */}
      {groupedByDate.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              Nenhuma transação no período selecionado
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map(([dateKey, dayTransactions]) => {
            const dayIncome = dayTransactions
              .filter((t) => t.type === "income")
              .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            const dayExpense = dayTransactions
              .filter((t) => t.type === "expense")
              .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            const dayNet = dayIncome - dayExpense;

            return (
              <Card key={dateKey}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{dateKey}</CardTitle>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <p className="text-muted-foreground">Entrada</p>
                        <p className="font-semibold text-green-600">{formatCurrency(dayIncome)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Saída</p>
                        <p className="font-semibold text-red-600">{formatCurrency(dayExpense)}</p>
                      </div>
                      <div className="text-right border-l pl-4">
                        <p className="text-muted-foreground">Líquido</p>
                        <p className={`font-semibold ${dayNet >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(dayNet)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dayTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 bg-accent rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.transactionDate).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
