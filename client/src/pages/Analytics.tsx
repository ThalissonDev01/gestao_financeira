import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function Analytics() {
  const { data: transactions = [] } = trpc.transactions.list.useQuery();
  const { data: accounts = [] } = trpc.accounts.list.useQuery();
  const { data: payables = [] } = trpc.payables.list.useQuery();
  const { data: receivables = [] } = trpc.receivables.list.useQuery();

  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  // Filtrar transações por período
  const filteredTransactions = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return transactions.filter((t) => {
      const tDate = new Date(t.transactionDate);
      return tDate >= start && tDate <= end;
    });
  }, [transactions, startDate, endDate]);

  // Dados para gráfico de receitas vs despesas por dia
  const dailyData = useMemo(() => {
    const grouped: Record<string, { income: number; expense: number }> = {};

    filteredTransactions.forEach((t) => {
      const dateKey = new Date(t.transactionDate).toLocaleDateString("pt-BR");
      if (!grouped[dateKey]) {
        grouped[dateKey] = { income: 0, expense: 0 };
      }

      const amount = parseFloat(t.amount);
      if (t.type === "income") {
        grouped[dateKey].income += amount;
      } else {
        grouped[dateKey].expense += amount;
      }
    });

    return Object.entries(grouped)
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .map(([date, data]) => ({
        date,
        Receitas: data.income,
        Despesas: data.expense,
      }));
  }, [filteredTransactions]);

  // Dados para gráfico de distribuição de contas
  const accountsData = useMemo(() => {
    return accounts.map((acc) => ({
      name: acc.name,
      value: parseFloat(acc.balance || "0"),
    }));
  }, [accounts]);

  // Dados para gráfico de status de contas a pagar
  const payablesStatusData = useMemo(() => {
    const data = {
      pending: 0,
      partial: 0,
      paid: 0,
      overdue: 0,
      cancelled: 0,
    };

    payables.forEach((p) => {
      data[p.status as keyof typeof data] += parseFloat(p.amount);
    });

    return Object.entries(data)
      .filter(([, value]) => value > 0)
      .map(([status, value]) => ({
        name: status === "pending" ? "Pendente" : status === "partial" ? "Parcial" : status === "paid" ? "Pago" : status === "overdue" ? "Vencido" : "Cancelado",
        value,
      }));
  }, [payables]);

  // Dados para gráfico de status de contas a receber
  const receivablesStatusData = useMemo(() => {
    const data = {
      pending: 0,
      partial: 0,
      received: 0,
      overdue: 0,
      cancelled: 0,
    };

    receivables.forEach((r) => {
      data[r.status as keyof typeof data] += parseFloat(r.amount);
    });

    return Object.entries(data)
      .filter(([, value]) => value > 0)
      .map(([status, value]) => ({
        name: status === "pending" ? "Pendente" : status === "partial" ? "Parcial" : status === "received" ? "Recebido" : status === "overdue" ? "Vencido" : "Cancelado",
        value,
      }));
  }, [receivables]);

  // Dados para gráfico de linha (fluxo acumulado)
  const cumulativeData = useMemo(() => {
    let balance = 0;
    return dailyData.map((item) => {
      balance += item.Receitas - item.Despesas;
      return {
        ...item,
        Saldo: balance,
      };
    });
  }, [dailyData]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Análise Financeira</h2>
        <p className="text-muted-foreground">Visualize seus dados financeiros em gráficos</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Período</CardTitle>
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

      {/* Gráfico de Receitas vs Despesas */}
      {dailyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Receitas vs Despesas</CardTitle>
            <CardDescription>Comparação diária de receitas e despesas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Receitas" fill="#10b981" />
                <Bar dataKey="Despesas" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Fluxo Acumulado */}
      {cumulativeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fluxo Acumulado</CardTitle>
            <CardDescription>Saldo acumulado ao longo do período</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Saldo"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Distribuição de Contas */}
        {accountsData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Contas</CardTitle>
              <CardDescription>Saldo por conta</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={accountsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: R$ ${value.toFixed(2)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {accountsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Gráfico de Status de Contas a Pagar */}
        {payablesStatusData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Contas a Pagar por Status</CardTitle>
              <CardDescription>Distribuição de contas a pagar</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={payablesStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: R$ ${value.toFixed(2)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {payablesStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Gráfico de Status de Contas a Receber */}
        {receivablesStatusData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Contas a Receber por Status</CardTitle>
              <CardDescription>Distribuição de contas a receber</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={receivablesStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: R$ ${value.toFixed(2)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {receivablesStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
