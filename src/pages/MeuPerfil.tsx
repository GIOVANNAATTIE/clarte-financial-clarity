import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Lock } from "lucide-react";

const MeuPerfil = () => {
  const { toast } = useToast();
  const [nome, setNome] = useState("Administrador");
  const [email, setEmail] = useState("admin@clarte.com.br");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const handleSavePerfil = () => {
    if (!nome.trim() || !email.trim()) {
      toast({ title: "Erro", description: "Nome e e-mail são obrigatórios.", variant: "destructive" });
      return;
    }
    toast({ title: "Perfil atualizado", description: "Seus dados foram salvos com sucesso." });
  };

  const handleChangePassword = () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      toast({ title: "Erro", description: "Preencha todos os campos de senha.", variant: "destructive" });
      return;
    }
    if (novaSenha !== confirmarSenha) {
      toast({ title: "Erro", description: "A nova senha e a confirmação não coincidem.", variant: "destructive" });
      return;
    }
    if (novaSenha.length < 6) {
      toast({ title: "Erro", description: "A nova senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }
    toast({ title: "Senha alterada", description: "Sua senha foi atualizada com sucesso." });
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarSenha("");
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <h1 className="font-heading text-2xl font-bold text-foreground">Meu Perfil</h1>

      <div className="bg-card rounded-xl border border-border p-6 shadow-[var(--shadow-card)] space-y-5">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><User size={18} className="text-gold" /> Dados Pessoais</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input value={nome} onChange={e => setNome(e.target.value)} className="pl-9" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="pl-9" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSavePerfil}>Salvar Dados</Button>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 shadow-[var(--shadow-card)] space-y-5">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><Lock size={18} className="text-gold" /> Alterar Senha</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Senha Atual</Label>
            <Input type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <Input type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Confirmar Nova Senha</Label>
              <Input type="password" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleChangePassword}>Alterar Senha</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeuPerfil;
