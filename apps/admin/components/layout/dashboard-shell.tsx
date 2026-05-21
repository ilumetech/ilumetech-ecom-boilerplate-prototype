"use client";

import { Layout, Menu, Typography, theme, Button, Drawer } from "antd";
import { UserButton, useUser } from "@clerk/nextjs";
import { useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { MenuProps } from "antd";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useAuthStore } from "@/stores/auth-store";
import {
  DashboardOutlined,
  ShoppingOutlined,
  UnorderedListOutlined,
  TagsOutlined,
  TeamOutlined,
  BgColorsOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { PERMISSIONS } from "@ilumetech/types";

const { Sider, Header, Content } = Layout;

interface NavChildConfig {
  key: string;
  label: string;
  permission: string | null;
  icon: React.ReactNode;
}

interface NavItemConfig {
  key: string;
  label: string;
  permission: string | null;
  icon: React.ReactNode;
  children?: NavChildConfig[];
}

const NAV_CONFIG: NavItemConfig[] = [
  {
    key: "products-group",
    label: "Produk",
    permission: PERMISSIONS.PRODUCT.READ,
    icon: <ShoppingOutlined />,
    children: [
      {
        key: "/products",
        label: "Daftar Produk",
        permission: PERMISSIONS.PRODUCT.READ,
        icon: <UnorderedListOutlined />,
      },
      {
        key: "/product-categories",
        label: "Kategori Produk",
        permission: PERMISSIONS.PRODUCT_CATEGORY.READ,
        icon: <TagsOutlined />,
      },
      {
        key: "/colors",
        label: "Warna",
        permission: PERMISSIONS.COLOR.READ,
        icon: <BgColorsOutlined />,
      },
    ],
  },
  {
    key: "/dashboard",
    label: "Dashboard",
    permission: null,
    icon: <DashboardOutlined />,
  },
  {
    key: "/users",
    label: "Tim",
    permission: PERMISSIONS.USER.READ,
    icon: <TeamOutlined />,
  },
];

function isItemVisible(
  permission: string | null,
  permissions: string[],
): boolean {
  return permission === null || permissions.includes(permission);
}

function buildMenuItems(
  navConfig: NavItemConfig[],
  permissions: string[],
): MenuProps["items"] {
  const items: MenuProps["items"] = [];

  for (const item of navConfig) {
    if (!isItemVisible(item.permission, permissions)) continue;

    if (!item.children) {
      items.push({ key: item.key, label: item.label, icon: item.icon });
      continue;
    }

    const visibleChildren = item.children.filter((child) =>
      isItemVisible(child.permission, permissions),
    );

    if (visibleChildren.length === 0) continue;

    if (visibleChildren.length === 1) {
      const [child] = visibleChildren;
      if (!child) continue;
      items.push({ key: child.key, label: child.label, icon: child.icon });
      continue;
    }

    items.push({
      key: item.key,
      label: item.label,
      icon: item.icon,
      children: visibleChildren.map((child) => ({
        key: child.key,
        label: child.label,
        icon: child.icon,
      })),
    });
  }

  return items;
}

function getSelectedKey(pathname: string, navConfig: NavItemConfig[]): string {
  const allLeafKeys = navConfig.flatMap((item) =>
    item.children ? item.children.map((c) => c.key) : [item.key],
  );
  return (
    allLeafKeys.find((k) => pathname === k || pathname.startsWith(k + "/")) ??
    ""
  );
}

function getDefaultOpenKeys(
  pathname: string,
  navConfig: NavItemConfig[],
): string[] {
  return navConfig
    .filter((item) =>
      item.children?.some(
        (child) =>
          pathname === child.key || pathname.startsWith(child.key + "/"),
      ),
    )
    .map((item) => item.key);
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const { token } = theme.useToken();
  const permissions = useAuthStore((state) => state.permissions);
  useCurrentUser();

  const menuItems = useMemo(
    () => buildMenuItems(NAV_CONFIG, permissions),
    [permissions],
  );
  const selectedKey = useMemo(
    () => getSelectedKey(pathname, NAV_CONFIG),
    [pathname],
  );
  const [defaultOpenKeys] = useState(() =>
    getDefaultOpenKeys(pathname, NAV_CONFIG),
  );

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    router.push(key);
    setMobileOpen(false);
  };

  const borderStyle = `1px solid ${token.colorBorderSecondary}`;

  return (
    <Layout className="min-h-screen">
      {/* Desktop Sidebar */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        className="hidden md:block!"
        style={{ borderRight: borderStyle }}
      >
        <div
          className="flex items-center h-16 px-4"
          style={{ borderBottom: borderStyle }}
        >
          {!collapsed && (
            <Typography.Text
              strong
              style={{ color: token.colorPrimary, fontSize: token.fontSize }}
            >
              IlumeTech ERP
            </Typography.Text>
          )}
        </div>
        <Menu
          mode="inline"
          items={menuItems}
          selectedKeys={[selectedKey]}
          defaultOpenKeys={defaultOpenKeys}
          onClick={handleMenuClick}
        />
      </Sider>

      {/* Mobile Drawer Navigation */}
      <Drawer
        title={
          <Typography.Text
            strong
            style={{ color: token.colorPrimary, fontSize: token.fontSize }}
          >
            IlumeTech ERP
          </Typography.Text>
        }
        placement="left"
        onClose={() => setMobileOpen(false)}
        open={mobileOpen}
        styles={{
          body: { padding: 0 },
          wrapper: { width: 250 },
        }}
      >
        <Menu
          mode="inline"
          items={menuItems}
          selectedKeys={[selectedKey]}
          defaultOpenKeys={defaultOpenKeys}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Drawer>

      <Layout>
        <Header
          className="flex items-center justify-between"
          style={{ padding: "0 24px", borderBottom: borderStyle }}
        >
          {/* Mobile hamburger menu & logo */}
          <div className="flex items-center md:hidden gap-3">
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setMobileOpen(true)}
              style={{ fontSize: "18px", width: 40, height: 40 }}
            />
            <Typography.Text
              strong
              style={{ color: token.colorPrimary, fontSize: token.fontSize }}
            >
              IlumeTech ERP
            </Typography.Text>
          </div>

          {/* Desktop spacer to push profile to the right */}
          <div className="hidden md:block" />

          <div className="flex items-center gap-3">
            <Typography.Text type="secondary">
              {user?.username ?? user?.firstName}
            </Typography.Text>
            <UserButton />
          </div>
        </Header>
        <Content className="m-3 md:m-6">{children}</Content>
      </Layout>
    </Layout>
  );
}
