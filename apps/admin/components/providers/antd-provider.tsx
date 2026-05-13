"use client";

import { App, ConfigProvider } from "antd";

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

export function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider theme={antdTheme}>
      <App>{children}</App>
    </ConfigProvider>
  );
}
