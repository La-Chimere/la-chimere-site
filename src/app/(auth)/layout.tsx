export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "36px 30px",
        textAlign: "center",
        gap: 0,
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>{children}</div>
    </div>
  );
}
