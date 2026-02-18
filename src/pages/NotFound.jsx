import React from "react";

export default function NotFound() {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.icon}>⚠️</span>
          <h1 style={styles.title}>404 Page Not Found</h1>
        </div>

        <p style={styles.text}>
          Did you forget to add the page to the router?
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f3f4f6",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    background: "#fff",
    padding: 25,
    borderRadius: 10,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    margin: 0,
    fontSize: 24,
  },
  text: {
    color: "#555",
    fontSize: 14,
    marginTop: 10,
  },
};
