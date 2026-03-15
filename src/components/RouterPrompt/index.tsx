import React, { useCallback, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useNavigate, useBlocker, Location } from 'react-router-dom';
import { Modal } from 'antd';

interface Props {
  defaultPath?: string;
  when: boolean;
  title?: string;
  onOK?: () => boolean | Promise<boolean>;
  onCancel?: () => boolean | Promise<boolean>;
  okText?: string;
  cancelText?: string;
  footer?: React.ReactNode;
  message?: React.ReactNode;
  validator?: (prompt: Location) => boolean;
}

export default forwardRef(function RouterPrompt(props: Props, ref) {
  const { defaultPath = '', when, onOK, onCancel, title = 'Unsaved changes', message = 'Are you sure want to leave this page ?', okText, cancelText, footer, validator } = props;
  const navigate = useNavigate();
  const [showPrompt, setShowPrompt] = useState(false);
  const [currentPath, setCurrentPath] = useState(defaultPath);

  let blocker: { state: string; proceed: () => void; reset: () => void } = {
    state: 'unblocked',
    proceed: () => { },
    reset: () => { },
  };
  try {
    blocker = useBlocker(({ nextLocation }) => {
      if (!when) return false;
      if (validator && validator(nextLocation)) return false;
      setCurrentPath(nextLocation.pathname);
      setShowPrompt(true);
      return true;
    }) as unknown as { state: string; proceed: () => void; reset: () => void };
  } catch {
    // Ignore in BrowserRouter context where data-router blocker is unavailable.
  }

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (when) {
        event.preventDefault();
        event.returnValue = message as string;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [when, message]);

  const redirect = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.proceed();
    } else {
      navigate(currentPath);
    }
    setShowPrompt(false);
  }, [blocker, currentPath, navigate]);

  const handleOK = useCallback(async () => {
    if (onOK) {
      const canRoute = await Promise.resolve(onOK());
      if (canRoute) {
        redirect();
      }
    } else {
      redirect();
    }
  }, [redirect, onOK]);

  const handleCancel = useCallback(async () => {
    if (onCancel) {
      const canRoute = await Promise.resolve(onCancel());
      if (canRoute) {
        redirect();
      }
    }
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
    setShowPrompt(false);
  }, [blocker, redirect, onCancel]);

  useImperativeHandle(
    ref,
    () => {
      return {
        redirect: redirect,
        hidePrompt: () => setShowPrompt(false),
        showPrompt: () => setShowPrompt(true),
      };
    },
    [currentPath],
  );

  return showPrompt ? (
    <Modal title={title} open={showPrompt} onOk={handleOK} okText={okText} onCancel={handleCancel} cancelText={cancelText} closable={true} footer={footer}>
      {message}
    </Modal>
  ) : null;
});
