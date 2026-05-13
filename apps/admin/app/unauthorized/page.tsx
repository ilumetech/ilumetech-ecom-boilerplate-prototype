'use client';

import Link from 'next/link';
import { Button, Result } from 'antd';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Result
        status="403"
        title="Akses Ditolak"
        subTitle="Anda tidak memiliki izin untuk mengakses halaman ini."
        extra={
          <Button type="primary">
            <Link href="/dashboard">Kembali ke Dashboard</Link>
          </Button>
        }
      />
    </div>
  );
}
