# PsiZen - Agente Psicológico

PsiZen é um assistente psicológico inteligente que utiliza IA para fornecer suporte emocional e orientação psicológica através de conversas por áudio.

##  Funcionalidades

- **Conversação por Áudio**: Grave e envie mensagens de áudio para conversar com o assistente
- **Resposta Inteligente**: Receba respostas personalizadas baseadas em IA
- **Interface Moderna**: Design limpo e intuitivo com animações suaves
- **PWA Ready**: Instalável como aplicativo no dispositivo móvel
- **Responsivo**: Funciona perfeitamente em desktop e mobile

## ️ Tecnologias

- **Frontend**: React 19 + TypeScript + Vite
- **UI**: Tailwind CSS + Shadcn/ui
- **Áudio**: Web Audio API + MediaRecorder
- **PWA**: Service Worker + Manifest
- **Roteamento**: React Router DOM

## 📱 PWA Features

- ✅ Instalação no dispositivo
- ✅ Funcionamento offline
- ✅ Cache inteligente
- ✅ Ícones adaptativos
- ✅ Tema personalizado

## 🎨 Design

- **Cores**: Tema azul moderno (#0066FF)
- **Tipografia**: Inter (Light, Regular, Medium, Bold)
- **Animações**: Suaves e responsivas
- **Layout**: Minimalista e focado

##  Como Executar

### Pré-requisitos
- Node.js 18+ 
- pnpm (recomendado) ou npm

### Instalação
```bash
# Clone o repositório
git clone https://github.com/romarioccmelo/psizen.git
cd psizen

# Instale as dependências
pnpm install

# Execute em modo desenvolvimento
pnpm dev

# Build para produção
pnpm build
```

### Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto:
```env
VITE_WEBHOOK_URL=https://workflow.usecurling.com/webhook/acd69b0c-3697-40dd-97d4-75f7b96c2c21
```

## 📁 Estrutura do Projeto
