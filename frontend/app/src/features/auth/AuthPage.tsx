import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoginMutation, useSendCodeMutation } from "../../api/hooks";
import { StateBlock } from "../../components/StateBlock";
import { ThemeToggle } from "../../components/ThemeToggle";

export function AuthPage() {
  const navigate = useNavigate();
  const [target, setTarget] = useState("alex@example.com");
  const [code, setCode] = useState("123456");
  const sendCode = useSendCodeMutation();
  const login = useLoginMutation();

  async function handleLogin() {
    const result = await login.mutateAsync({ target, code });
    navigate(result.nextRoute === "onboarding" ? "/collection" : "/collection", { replace: true });
  }

  return (
    <main className="auth-screen">
      <div className="auth-card">
        <div className="auth-top">
          <div>
            <p className="eyebrow">PRISM ACCESS</p>
            <h1>世界观透镜</h1>
          </div>
          <ThemeToggle />
        </div>
        <p className="auth-copy">登录后，拍下一处现实现场，并让一枚世界观镜片重新解释它。</p>

        <label className="field">
          <span>EMAIL / PHONE</span>
          <input value={target} onChange={(event) => setTarget(event.target.value)} inputMode="email" />
        </label>
        <div className="code-row">
          <label className="field">
            <span>CODE</span>
            <input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" />
          </label>
          <button className="secondary-button" onClick={() => sendCode.mutate({ target })} disabled={sendCode.isPending}>
            {sendCode.isPending ? "SENDING" : "SEND"}
          </button>
        </div>
        {sendCode.data ? <p className="form-hint">验证码已发送至 {sendCode.data.maskedTarget}</p> : null}
        {sendCode.error ? <p className="form-error">{sendCode.error.message}</p> : null}
        {login.error ? <p className="form-error">{login.error.message}</p> : null}
        <button className="primary-button" onClick={handleLogin} disabled={login.isPending}>
          {login.isPending ? "AUTHENTICATING" : "ENTER OBSERVATORY"}
        </button>
      </div>
      <StateBlock title="P0 DEMO MODE" body="默认接入本地 Mock Server，验证码可直接使用 123456。" />
    </main>
  );
}
