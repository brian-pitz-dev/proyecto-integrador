import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandMark } from "@/components/brand-mark";

export const metadata: Metadata = {
  title: "Términos y privacidad · Bakata",
  description: "Qué datos guarda Bakata, para qué los usa y quién los procesa.",
  alternates: { canonical: "/privacidad" },
};

const SECCIONES = [
  {
    titulo: "Qué es Bakata",
    texto: [
      "Bakata es un proyecto integrador académico, gratuito, que arma un plan de entrenamiento y de comidas a partir de tus datos y tus eventos. No es un servicio médico ni nutricional: la información es orientativa. Antes de empezar un plan de entrenamiento o cambiar tu alimentación, y ante cualquier dolor, lesión o condición de salud, consultá a un profesional.",
    ],
  },
  {
    titulo: "Qué datos guardamos",
    texto: [
      "Cuenta: tu nombre, tu email y tu contraseña (cifrada; nadie puede leerla).",
      "Perfil: fecha de nacimiento, sexo, altura, peso, nivel de actividad, metas y, si la cargás, una calibración personal (por ejemplo, de una medición InBody).",
      "Tus eventos y lo que registres en la app: peso, calorías, sueño, tiradas, días completados y resultados.",
      "Las fotos de progreso que subas. Son privadas: solo vos podés verlas. Antes de subirlas, la app las achica y les borra los datos del archivo, incluida la ubicación.",
      "Los planes que generes con el Coach y un contador de cuántas consultas usaste cada día.",
    ],
  },
  {
    titulo: "Para qué los usamos",
    texto: [
      "Solo para calcular tu plan, tus calorías y tus estadísticas, y para que el Coach te responda con contexto. No los vendemos, no los usamos para publicidad y no los compartimos con nadie más que los servicios de abajo.",
    ],
  },
  {
    titulo: "Quién los procesa",
    texto: [
      "Supabase guarda la base de datos, las cuentas y las fotos (servidores en San Pablo, Brasil). Netlify aloja la app. Cloudflare Turnstile verifica que no seas un bot al registrarte o iniciar sesión.",
      "El Coach usa Google Gemini en su nivel gratuito. Cuando le escribís o le pedís un plan, Google recibe tu mensaje y un resumen de tu plan (edad, sexo, altura, peso, metas, eventos, fase y registros recientes), pero no tu nombre ni tu email. En el nivel gratuito, Google puede usar ese contenido para mejorar sus productos: no le escribas al Coach datos que no quieras compartir.",
    ],
  },
  {
    titulo: "Tus derechos",
    texto: [
      "Desde Mi perfil podés corregir tus datos, descargar una copia de todo lo que guardamos y borrar tu cuenta. Al borrar la cuenta se eliminan tu perfil, tus eventos, tus registros, tus fotos y tus planes, y no se puede deshacer.",
    ],
  },
  {
    titulo: "Uso aceptable",
    texto: [
      "La cuenta es personal. Cada cuenta tiene un límite diario de consultas al Coach para que el servicio siga siendo gratuito; intentar saltear los límites o automatizar el uso puede dar de baja la cuenta.",
    ],
  },
];

export default function PrivacidadPage() {
  return (
    <div className="relative min-h-dvh px-4 py-10">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <article className="mx-auto grid w-full max-w-prose gap-6">
        <BrandMark />
        <header className="grid gap-1">
          <h1 className="text-3xl font-bold">Términos y privacidad</h1>
          <p className="text-sm text-muted-foreground">
            Última actualización: 13 de noviembre de 2026
          </p>
        </header>
        {SECCIONES.map((s) => (
          <section key={s.titulo} className="grid gap-2">
            <h2 className="text-xl font-semibold">{s.titulo}</h2>
            {s.texto.map((t) => (
              <p key={t} className="text-muted-foreground">
                {t}
              </p>
            ))}
          </section>
        ))}
        <p className="text-sm">
          <Link href="/signup" className="font-semibold underline underline-offset-2">
            Volver al registro
          </Link>
        </p>
      </article>
    </div>
  );
}
