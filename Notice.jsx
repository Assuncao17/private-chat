import Logo from "./Logo.jsx";

export default function Notice({ title, body, action }) {
  return (
    <main className="center">
      <div className="notice">
        <Logo />
        <h1>{title}</h1>
        <p className="muted">{body}</p>
        {action && (
          <button className="btn" onClick={action.onClick}>
            {action.label}
          </button>
        )}
      </div>
    </main>
  );
}
