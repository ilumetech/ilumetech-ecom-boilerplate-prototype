"use client";

import { App, ConfigProvider } from "antd";
import { useEffect } from "react";
import { setStaticMessage } from "@/lib/utils/handle-error";

const antdTheme = {
  token: {
    colorPrimary: "#1677ff",
    borderRadius: 6,
  },
  components: {
    Layout: {
      headerBg: "#ffffff",
      headerColor: "rgba(0, 0, 0, 0.88)",
      bodyBg: "#f5f5f5",
      footerBg: "#f9fafb",
      siderBg: "#ffffff",
      triggerBg: "#f5f5f5",
      triggerColor: "rgba(0, 0, 0, 0.45)",
    },
  },
};

function AntdAppBridge() {
  const { message } = App.useApp();

  useEffect(() => {
    setStaticMessage(message);
  }, [message]);

  return null;
}

export function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider theme={antdTheme}>
      <App>
        <AntdAppBridge />
        {children}
      </App>
    </ConfigProvider>
  );
}
