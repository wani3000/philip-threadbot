import { env } from "../../config/env";
import { getCurrentThreadsUser } from "../threads/client";
import { isDemoModeEnabled } from "../runtime";

type ReadinessStatus = "ready" | "warning" | "blocked";

type ReadinessCheck = {
  key: string;
  label: string;
  status: ReadinessStatus;
  message: string;
  details?: string[];
};

export type OperationalReadiness = {
  mode: "demo" | "live";
  overallStatus: ReadinessStatus;
  summary: {
    ready: number;
    warning: number;
    blocked: number;
  };
  checks: ReadinessCheck[];
};

function getMissingEnvNames(
  requiredEnvMap: Record<string, string | undefined | null>
) {
  return Object.entries(requiredEnvMap)
    .filter(([, value]) => !value)
    .map(([name]) => name);
}

async function getThreadsCheck(): Promise<ReadinessCheck> {
  const missingEnvNames = getMissingEnvNames({
    THREADS_APP_ID: env.THREADS_APP_ID,
    THREADS_APP_SECRET: env.THREADS_APP_SECRET,
    THREADS_REDIRECT_URI: env.THREADS_REDIRECT_URI,
    THREADS_ACCESS_TOKEN: env.THREADS_ACCESS_TOKEN,
    THREADS_USER_ID: env.THREADS_USER_ID
  });

  if (missingEnvNames.length > 0) {
    return {
      key: "threads",
      label: "Threads 게시 연동",
      status: "blocked",
      message: "Threads 운영 게시에 필요한 설정값이 아직 부족합니다.",
      details: missingEnvNames
    };
  }

  try {
    const profile = await getCurrentThreadsUser(env.THREADS_ACCESS_TOKEN!);

    return {
      key: "threads",
      label: "Threads 게시 연동",
      status: "ready",
      message: `@${profile.username} 계정과 실제 게시 토큰이 연결되어 있습니다.`,
      details: [`THREADS_USER_ID=${env.THREADS_USER_ID}`]
    };
  } catch (error) {
    return {
      key: "threads",
      label: "Threads 게시 연동",
      status: "blocked",
      message: "Threads 토큰 검증에 실패했습니다.",
      details: [error instanceof Error ? error.message : "Unknown error"]
    };
  }
}

async function getTelegramCheck(): Promise<ReadinessCheck> {
  const missingEnvNames = getMissingEnvNames({
    TELEGRAM_BOT_TOKEN: env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: env.TELEGRAM_CHAT_ID
  });

  if (missingEnvNames.length > 0) {
    return {
      key: "telegram",
      label: "텔레그램 미리보기 알림",
      status: "blocked",
      message: "텔레그램 알림에 필요한 설정값이 아직 부족합니다.",
      details: missingEnvNames
    };
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getMe`,
      {
        signal: AbortSignal.timeout(10_000),
        method: "GET"
      }
    );

    const payload = (await response.json()) as {
      ok?: boolean;
      result?: { username?: string };
      description?: string;
    };

    if (!response.ok || payload.ok === false) {
      return {
        key: "telegram",
        label: "텔레그램 미리보기 알림",
        status: "blocked",
        message: "텔레그램 봇 연결 검증에 실패했습니다.",
        details: [payload.description ?? `HTTP ${response.status}`]
      };
    }

    return {
      key: "telegram",
      label: "텔레그램 미리보기 알림",
      status: "ready",
      message: `@${payload.result?.username ?? "telegram-bot"} 봇으로 전송할 준비가 되었습니다.`,
      details: [`TELEGRAM_CHAT_ID=${env.TELEGRAM_CHAT_ID}`]
    };
  } catch (error) {
    return {
      key: "telegram",
      label: "텔레그램 미리보기 알림",
      status: "blocked",
      message: "텔레그램 봇 연결을 확인하지 못했습니다.",
      details: [error instanceof Error ? error.message : "Unknown error"]
    };
  }
}

function getSupabaseCheck(): ReadinessCheck {
  const missingEnvNames = getMissingEnvNames({
    SUPABASE_URL: env.SUPABASE_URL,
    SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY
  });

  if (missingEnvNames.length > 0) {
    return {
      key: "supabase",
      label: "Supabase 실DB",
      status: "blocked",
      message:
        "운영 데이터 저장과 인증 검증에 필요한 Supabase 설정이 비어 있습니다.",
      details: missingEnvNames
    };
  }

  return {
    key: "supabase",
    label: "Supabase 실DB",
    status: "ready",
    message: "실DB 연결에 필요한 서버 환경변수가 준비되어 있습니다."
  };
}

function getLlmCheck(): ReadinessCheck {
  const configuredProviders = [
    env.ANTHROPIC_API_KEY ? "Anthropic" : null,
    env.OPENAI_API_KEY ? "OpenAI" : null,
    env.GEMINI_API_KEY ? "Gemini" : null
  ].filter(Boolean) as string[];

  if (configuredProviders.length === 0) {
    return {
      key: "llm",
      label: "LLM 초안 생성",
      status: "blocked",
      message: "실초안 생성을 위한 LLM provider 키가 아직 없습니다.",
      details: ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY"]
    };
  }

  return {
    key: "llm",
    label: "LLM 초안 생성",
    status: "ready",
    message: `${configuredProviders.join(", ")} provider가 연결되어 있습니다.`
  };
}

function getCronCheck(): ReadinessCheck {
  const missingEnvNames = getMissingEnvNames({
    CRON_SECRET: env.CRON_SECRET,
    APP_URL: env.APP_URL
  });

  if (missingEnvNames.length > 0) {
    return {
      key: "cron",
      label: "예약 실행 경로",
      status: "blocked",
      message: "배치 실행을 위한 환경변수가 비어 있습니다.",
      details: missingEnvNames
    };
  }

  return {
    key: "cron",
    label: "예약 실행 경로",
    status: "ready",
    message: "cron 인증과 앱 기준 URL이 준비되어 있습니다."
  };
}

function getModeCheck(): ReadinessCheck {
  if (isDemoModeEnabled()) {
    return {
      key: "mode",
      label: "운영 모드",
      status: "blocked",
      message: "현재 배포 API가 demo mode로 실행 중입니다.",
      details: ["LOCAL_DEMO_MODE", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
    };
  }

  return {
    key: "mode",
    label: "운영 모드",
    status: "ready",
    message: "배포 API가 live mode로 실행 중입니다."
  };
}

export async function getOperationalReadiness(): Promise<OperationalReadiness> {
  const checks = await Promise.all([
    Promise.resolve(getModeCheck()),
    Promise.resolve(getSupabaseCheck()),
    Promise.resolve(getLlmCheck()),
    Promise.resolve(getCronCheck()),
    getTelegramCheck(),
    getThreadsCheck()
  ]);

  const summary = checks.reduce(
    (accumulator, check) => {
      accumulator[check.status] += 1;
      return accumulator;
    },
    {
      ready: 0,
      warning: 0,
      blocked: 0
    }
  );

  const overallStatus: ReadinessStatus =
    summary.blocked > 0 ? "blocked" : summary.warning > 0 ? "warning" : "ready";

  return {
    mode: isDemoModeEnabled() ? "demo" : "live",
    overallStatus,
    summary,
    checks
  };
}
