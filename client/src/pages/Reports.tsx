import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Reports() {
  const { data: reports = [], refetch } = trpc.reports.list.useQuery();
  const { data: transactions = [] } = trpc.transactions.list.useQuery();
  const { data: payables = [] } = trpc.payables.list.useQuery();
  const { data: receivables = [] } = trpc.receivables.list.useQuery();

  const createMutation = trpc.reports.create.useMutation();
  const deleteMutation = trpc.reports.delete.useMutation();

  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState<"income_expense" | "cash_flow" | "payables" | "receivables" | "summary">("income_expense");
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  const generateReport = async () => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      let reportData: any = {};

      if (reportType === "income_expense") {
        const filteredTransactions = transactions.filter((t) => {
          const tDate = new Date(t.transactionDate);
          return tDate >= start && tDate <= end;
        });

        const income = filteredTransactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const expense = filteredTransactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        reportData = {
          totalIncome: income,
          totalExpense: expense,
          netFlow: income - expense,
          transactionCount: filteredTransactions.length,
        };
      } else if (reportType === "payables") {
        const filteredPayables = payables.filter((p) => {
          const pDate = new Date(p.dueDate);
          return pDate >= start && pDate <= end;
        });

        const pending = filteredPayables.filter((p) => p.status === "pending").reduce((sum, p) => sum + parseFloat(p.amount), 0);
        const paid = filteredPayables.filter((p) => p.status === "paid").reduce((sum, p) => sum + parseFloat(p.amount), 0);
        const overdue = filteredPayables.filter((p) => p.status === "overdue").reduce((sum, p) => sum + parseFloat(p.amount), 0);

        reportData = {
          totalPayables: pending + paid + overdue,
          pendingAmount: pending,
          paidAmount: paid,
          overdueAmount: overdue,
          count: filteredPayables.length,
        };
      } else if (reportType === "receivables") {
        const filteredReceivables = receivables.filter((r) => {
          const rDate = new Date(r.dueDate);
          return rDate >= start && rDate <= end;
        });

        const pending = filteredReceivables.filter((r) => r.status === "pending").reduce((sum, r) => sum + parseFloat(r.amount), 0);
        const received = filteredReceivables.filter((r) => r.status === "received").reduce((sum, r) => sum + parseFloat(r.amount), 0);
        const overdue = filteredReceivables.filter((r) => r.status === "overdue").reduce((sum, r) => sum + parseFloat(r.amount), 0);

        reportData = {
          totalReceivables: pending + received + overdue,
          pendingAmount: pending,
          receivedAmount: received,
          overdueAmount: overdue,
          count: filteredReceivables.length,
        };
      } else if (reportType === "summary") {
        const filteredTransactions = transactions.filter((t) => {
          const tDate = new Date(t.transactionDate);
          return tDate >= start && tDate <= end;
        });

        const income = filteredTransactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const expense = filteredTransactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const filteredPayables = payables.filter((p) => {
          const pDate = new Date(p.dueDate);
          return pDate >= start && pDate <= end;
        });

        const filteredReceivables = receivables.filter((r) => {
          const rDate = new Date(r.dueDate);
          return rDate >= start && rDate <= end;
        });

        reportData = {
          totalIncome: income,
          totalExpense: expense,
          netFlow: income - expense,
          payablesCount: filteredPayables.length,
          receivablesCount: filteredReceivables.length,
          transactionCount: filteredTransactions.length,
        };
      }

      await createMutation.mutateAsync({
        title: `Relatório de ${reportType.replace(/_/g, " ")} - ${new Date().toLocaleDateString("pt-BR")}`,
        type: reportType,
        startDate: start,
        endDate: end,
        data: JSON.stringify(reportData),
      });

      toast.success("Relatório gerado com sucesso");
      setOpen(false);
      refetch();
    } catch (error) {
      toast.error("Erro ao gerar relatório");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja deletar este relatório?")) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast.success("Relatório deletado");
        refetch();
      } catch (error) {
        toast.error("Erro ao deletar relatório");
      }
    }
  };

  const downloadReport = (report: any) => {
    const data = JSON.parse(report.data);
    const csv = generateCSV(report.type, data, report.startDate, report.endDate);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.title}.csv`;
    a.click();
  };

  const generateCSV = (type: string, data: any, startDate: string, endDate: string) => {
    let csv = `Relatório de ${type}\nPeríodo: ${new Date(startDate).toLocaleDateString("pt-BR")} a ${new Date(endDate).toLocaleDateString("pt-BR")}\n\n`;

    if (type === "income_expense") {
      csv += "Receitas,Despesas,Fluxo Líquido\n";
      csv += `${data.totalIncome},${data.totalExpense},${data.netFlow}\n`;
    } else if (type === "payables") {
      csv += "Total,Pendente,Pago,Vencido\n";
      csv += `${data.totalPayables},${data.pendingAmount},${data.paidAmount},${data.overdueAmount}\n`;
    } else if (type === "receivables") {
      csv += "Total,Pendente,Recebido,Vencido\n";
      csv += `${data.totalReceivables},${data.pendingAmount},${data.receivedAmount},${data.overdueAmount}\n`;
    }

    return csv;
  };

  const typeLabels = {
    income_expense: "Receitas e Despesas",
    cash_flow: "Fluxo de Caixa",
    payables: "Contas a Pagar",
    receivables: "Contas a Receber",
    summary: "Resumo Geral",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Relatórios</h2>
          <p className="text-muted-foreground">Gere e acompanhe seus relatórios financeiros</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Relatório
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gerar Novo Relatório</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tipo de Relatório</label>
                <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income_expense">Receitas e Despesas</SelectItem>
                    <SelectItem value="cash_flow">Fluxo de Caixa</SelectItem>
                    <SelectItem value="payables">Contas a Pagar</SelectItem>
                    <SelectItem value="receivables">Contas a Receber</SelectItem>
                    <SelectItem value="summary">Resumo Geral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              <Button onClick={generateReport} className="w-full">
                Gerar Relatório
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              Nenhum relatório gerado ainda
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">{report.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {typeLabels[report.type as keyof typeof typeLabels]} • {new Date(report.startDate).toLocaleDateString("pt-BR")} a {new Date(report.endDate).toLocaleDateString("pt-BR")}
                    </p>
                    <div className="bg-accent p-3 rounded-lg">
                      <pre className="text-xs overflow-auto max-h-32">
                        {JSON.stringify(JSON.parse(report.data), null, 2)}
                      </pre>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => downloadReport(report)}
                      className="p-2 hover:bg-accent rounded-md transition-colors"
                      title="Baixar relatório"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="p-2 hover:bg-destructive/10 rounded-md transition-colors"
                      title="Deletar relatório"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
