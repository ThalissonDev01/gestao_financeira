import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { Settings as SettingsIcon, User, LogOut } from "lucide-react";

export default function Settings() {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Configurações</h2>
        <p className="text-muted-foreground">Gerencie suas preferências e informações de perfil</p>
      </div>

      {/* Perfil do Usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Perfil do Usuário
          </CardTitle>
          <CardDescription>Informações da sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Nome</label>
            <p className="font-semibold">{user?.name || "Não informado"}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Email</label>
            <p className="font-semibold">{user?.email || "Não informado"}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Tipo de Conta</label>
            <p className="font-semibold capitalize">{user?.role || "Usuário"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Preferências */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Preferências
          </CardTitle>
          <CardDescription>Personalize sua experiência</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Moeda Padrão</p>
                <p className="text-sm text-muted-foreground">Real Brasileiro (BRL)</p>
              </div>
              <span className="text-sm font-semibold">BRL</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Formato de Data</p>
                <p className="text-sm text-muted-foreground">DD/MM/YYYY</p>
              </div>
              <span className="text-sm font-semibold">DD/MM/YYYY</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Fuso Horário</p>
                <p className="text-sm text-muted-foreground">Brasília (GMT-3)</p>
              </div>
              <span className="text-sm font-semibold">GMT-3</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Segurança */}
      <Card>
        <CardHeader>
          <CardTitle>Segurança</CardTitle>
          <CardDescription>Gerencie sua segurança e sessões</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Autenticação</p>
              <p className="text-sm text-muted-foreground">Manus OAuth</p>
            </div>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Ativo</span>
          </div>
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="font-medium">Sair de Todas as Sessões</p>
              <p className="text-sm text-muted-foreground">Encerre sua sessão atual</p>
            </div>
            <Button variant="outline" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informações */}
      <Card>
        <CardHeader>
          <CardTitle>Sobre</CardTitle>
          <CardDescription>Informações sobre o sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Versão</p>
            <p className="font-semibold">1.0.0</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Última Atualização</p>
            <p className="font-semibold">{new Date().toLocaleDateString("pt-BR")}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Plataforma</p>
            <p className="font-semibold">Sistema de Gestão Financeira</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
