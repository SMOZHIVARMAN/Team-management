Uncaught Error: useNavigate() may be used only in the context of a <Router> component.
    at invariant (react-router-dom.js?v=062e5259:209:11)
    at useNavigateUnstable (react-router-dom.js?v=062e5259:3858:34)
    at useNavigate (react-router-dom.js?v=062e5259:3855:46)
    at AuthProvider (AuthContext.tsx:33:20)
    at renderWithHooks (chunk-6VWAHX6D.js?v=b2e91926:11548:26)
    at mountIndeterminateComponent (chunk-6VWAHX6D.js?v=b2e91926:14926:21)
    at beginWork (chunk-6VWAHX6D.js?v=b2e91926:15914:22)
    at HTMLUnknownElement.callCallback2 (chunk-6VWAHX6D.js?v=b2e91926:3674:22)
    at Object.invokeGuardedCallbackDev (chunk-6VWAHX6D.js?v=b2e91926:3699:24)
    at invokeGuardedCallback (chunk-6VWAHX6D.js?v=b2e91926:3733:39)
invariant @ react-router-dom.js?v=062e5259:209
useNavigateUnstable @ react-router-dom.js?v=062e5259:3858
useNavigate @ react-router-dom.js?v=062e5259:3855
AuthProvider @ AuthContext.tsx:33
renderWithHooks @ chunk-6VWAHX6D.js?v=b2e91926:11548
mountIndeterminateComponent @ chunk-6VWAHX6D.js?v=b2e91926:14926
beginWork @ chunk-6VWAHX6D.js?v=b2e91926:15914
callCallback2 @ chunk-6VWAHX6D.js?v=b2e91926:3674
invokeGuardedCallbackDev @ chunk-6VWAHX6D.js?v=b2e91926:3699
invokeGuardedCallback @ chunk-6VWAHX6D.js?v=b2e91926:3733
beginWork$1 @ chunk-6VWAHX6D.js?v=b2e91926:19765
performUnitOfWork @ chunk-6VWAHX6D.js?v=b2e91926:19198
workLoopSync @ chunk-6VWAHX6D.js?v=b2e91926:19137
renderRootSync @ chunk-6VWAHX6D.js?v=b2e91926:19116
performConcurrentWorkOnRoot @ chunk-6VWAHX6D.js?v=b2e91926:18678
workLoop @ chunk-6VWAHX6D.js?v=b2e91926:197
flushWork @ chunk-6VWAHX6D.js?v=b2e91926:176
performWorkUntilDeadline @ chunk-6VWAHX6D.js?v=b2e91926:384Understand this error
react-router-dom.js?v=062e5259:209 Uncaught Error: useNavigate() may be used only in the context of a <Router> component.
    at invariant (react-router-dom.js?v=062e5259:209:11)
    at useNavigateUnstable (react-router-dom.js?v=062e5259:3858:34)
    at useNavigate (react-router-dom.js?v=062e5259:3855:46)
    at AuthProvider (AuthContext.tsx:33:20)
    at renderWithHooks (chunk-6VWAHX6D.js?v=b2e91926:11548:26)
    at mountIndeterminateComponent (chunk-6VWAHX6D.js?v=b2e91926:14926:21)
    at beginWork (chunk-6VWAHX6D.js?v=b2e91926:15914:22)
    at HTMLUnknownElement.callCallback2 (chunk-6VWAHX6D.js?v=b2e91926:3674:22)
    at Object.invokeGuardedCallbackDev (chunk-6VWAHX6D.js?v=b2e91926:3699:24)
    at invokeGuardedCallback (chunk-6VWAHX6D.js?v=b2e91926:3733:39)
invariant @ react-router-dom.js?v=062e5259:209
useNavigateUnstable @ react-router-dom.js?v=062e5259:3858
useNavigate @ react-router-dom.js?v=062e5259:3855
AuthProvider @ AuthContext.tsx:33
renderWithHooks @ chunk-6VWAHX6D.js?v=b2e91926:11548
mountIndeterminateComponent @ chunk-6VWAHX6D.js?v=b2e91926:14926
beginWork @ chunk-6VWAHX6D.js?v=b2e91926:15914
callCallback2 @ chunk-6VWAHX6D.js?v=b2e91926:3674
invokeGuardedCallbackDev @ chunk-6VWAHX6D.js?v=b2e91926:3699
invokeGuardedCallback @ chunk-6VWAHX6D.js?v=b2e91926:3733
beginWork$1 @ chunk-6VWAHX6D.js?v=b2e91926:19765
performUnitOfWork @ chunk-6VWAHX6D.js?v=b2e91926:19198
workLoopSync @ chunk-6VWAHX6D.js?v=b2e91926:19137
renderRootSync @ chunk-6VWAHX6D.js?v=b2e91926:19116
recoverFromConcurrentError @ chunk-6VWAHX6D.js?v=b2e91926:18736
performConcurrentWorkOnRoot @ chunk-6VWAHX6D.js?v=b2e91926:18684
workLoop @ chunk-6VWAHX6D.js?v=b2e91926:197
flushWork @ chunk-6VWAHX6D.js?v=b2e91926:176
performWorkUntilDeadline @ chunk-6VWAHX6D.js?v=b2e91926:384Understand this error
hook.js:608 The above error occurred in the <AuthProvider> component:

    at AuthProvider (http://localhost:5173/src/contexts/AuthContext.tsx?t=1754295959343:32:32)
    at App

Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://reactjs.org/link/error-boundaries to learn more about error boundaries.
overrideMethod @ hook.js:608
logCapturedError @ chunk-6VWAHX6D.js?v=b2e91926:14032
update.callback @ chunk-6VWAHX6D.js?v=b2e91926:14052
callCallback @ chunk-6VWAHX6D.js?v=b2e91926:11248
commitUpdateQueue @ chunk-6VWAHX6D.js?v=b2e91926:11265
commitLayoutEffectOnFiber @ chunk-6VWAHX6D.js?v=b2e91926:17093
commitLayoutMountEffects_complete @ chunk-6VWAHX6D.js?v=b2e91926:17980
commitLayoutEffects_begin @ chunk-6VWAHX6D.js?v=b2e91926:17969
commitLayoutEffects @ chunk-6VWAHX6D.js?v=b2e91926:17920
commitRootImpl @ chunk-6VWAHX6D.js?v=b2e91926:19353
commitRoot @ chunk-6VWAHX6D.js?v=b2e91926:19277
finishConcurrentRender @ chunk-6VWAHX6D.js?v=b2e91926:18760
performConcurrentWorkOnRoot @ chunk-6VWAHX6D.js?v=b2e91926:18718
workLoop @ chunk-6VWAHX6D.js?v=b2e91926:197
flushWork @ chunk-6VWAHX6D.js?v=b2e91926:176
performWorkUntilDeadline @ chunk-6VWAHX6D.js?v=b2e91926:384Understand this error
chunk-6VWAHX6D.js?v=b2e91926:19413 Uncaught Error: useNavigate() may be used only in the context of a <Router> component.
    at invariant (react-router-dom.js?v=062e5259:209:11)
    at useNavigateUnstable (react-router-dom.js?v=062e5259:3858:34)
    at useNavigate (react-router-dom.js?v=062e5259:3855:46)
    at AuthProvider (AuthContext.tsx:33:20)
    at renderWithHooks (chunk-6VWAHX6D.js?v=b2e91926:11548:26)
    at mountIndeterminateComponent (chunk-6VWAHX6D.js?v=b2e91926:14926:21)
    at beginWork (chunk-6VWAHX6D.js?v=b2e91926:15914:22)
    at beginWork$1 (chunk-6VWAHX6D.js?v=b2e91926:19753:22)
    at performUnitOfWork (chunk-6VWAHX6D.js?v=b2e91926:19198:20)
    at workLoopSync (chunk-6VWAHX6D.js?v=b2e91926:19137:13)
invariant @ react-router-dom.js?v=062e5259:209
useNavigateUnstable @ react-router-dom.js?v=062e5259:3858
useNavigate @ react-router-dom.js?v=062e5259:3855
AuthProvider @ AuthContext.tsx:33
renderWithHooks @ chunk-6VWAHX6D.js?v=b2e91926:11548
mountIndeterminateComponent @ chunk-6VWAHX6D.js?v=b2e91926:14926
beginWork @ chunk-6VWAHX6D.js?v=b2e91926:15914
beginWork$1 @ chunk-6VWAHX6D.js?v=b2e91926:19753
performUnitOfWork @ chunk-6VWAHX6D.js?v=b2e91926:19198
workLoopSync @ chunk-6VWAHX6D.js?v=b2e91926:19137
renderRootSync @ chunk-6VWAHX6D.js?v=b2e91926:19116
recoverFromConcurrentError @ chunk-6VWAHX6D.js?v=b2e91926:18736
performConcurrentWorkOnRoot @ chunk-6VWAHX6D.js?v=b2e91926:18684
workLoop @ chunk-6VWAHX6D.js?v=b2e91926:197
flushWork @ chunk-6VWAHX6D.js?v=b2e91926:176
performWorkUntilDeadline @ chunk-6VWAHX6D.js?v=b2e91926:384Understand this error1