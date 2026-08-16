; Custom NSIS options for MarkDown Viewer:
; - Assisted installer page: Start menu / Desktop / Taskbar shortcuts
; - Create or update selected shortcuts after install
; - Best-effort taskbar pin (may be blocked by Windows policy)

!include "nsDialogs.nsh"
!include "LogicLib.nsh"

!ifndef BUILD_UNINSTALLER

Var MDV_Dialog
Var MDV_ChkStart
Var MDV_ChkDesktop
Var MDV_ChkTaskbar
Var MDV_DoStartMenu
Var MDV_DoDesktop
Var MDV_DoTaskbar
Var MDV_Label

!macro customInit
  ; Defaults (also used for silent installs)
  StrCpy $MDV_DoStartMenu "1"
  StrCpy $MDV_DoDesktop "1"
  StrCpy $MDV_DoTaskbar "1"
!macroend

; Shown after install directory selection (assisted installer only)
!macro customPageAfterChangeDir
  Page custom MDV_CreateShortcutsPage MDV_LeaveShortcutsPage
!macroend

Function MDV_CreateShortcutsPage
  nsDialogs::Create 1018
  Pop $MDV_Dialog
  ${If} $MDV_Dialog == error
    Abort
  ${EndIf}

  ; Set MUI header text via dialog items
  GetDlgItem $0 $HWNDPARENT 1037
  SendMessage $0 ${WM_SETTEXT} 0 "STR:Shortcut options"
  GetDlgItem $0 $HWNDPARENT 1038
  SendMessage $0 ${WM_SETTEXT} 0 "STR:Create or update Start menu, desktop, and taskbar links"

  ${NSD_CreateLabel} 0 0 100% 24u "Choose which links to create or update for MarkDown Viewer:"
  Pop $MDV_Label

  ${NSD_CreateCheckbox} 10u 32u 100% 12u "Start menu shortcut (create / update)"
  Pop $MDV_ChkStart
  ${If} $MDV_DoStartMenu == "1"
    ${NSD_Check} $MDV_ChkStart
  ${EndIf}

  ${NSD_CreateCheckbox} 10u 52u 100% 12u "Desktop shortcut (create / update)"
  Pop $MDV_ChkDesktop
  ${If} $MDV_DoDesktop == "1"
    ${NSD_Check} $MDV_ChkDesktop
  ${EndIf}

  ${NSD_CreateCheckbox} 10u 72u 100% 12u "Pin to Taskbar"
  Pop $MDV_ChkTaskbar
  ${If} $MDV_DoTaskbar == "1"
    ${NSD_Check} $MDV_ChkTaskbar
  ${EndIf}

  ${NSD_CreateLabel} 10u 100u 100% 40u "On upgrade, checked items are refreshed so shortcuts point at this install. Taskbar pinning is best-effort and may be disabled by Windows on some PCs — you can still pin manually from the Start menu."
  Pop $MDV_Label

  nsDialogs::Show
FunctionEnd

Function MDV_LeaveShortcutsPage
  ${NSD_GetState} $MDV_ChkStart $0
  ${If} $0 == ${BST_CHECKED}
    StrCpy $MDV_DoStartMenu "1"
  ${Else}
    StrCpy $MDV_DoStartMenu "0"
  ${EndIf}

  ${NSD_GetState} $MDV_ChkDesktop $0
  ${If} $0 == ${BST_CHECKED}
    StrCpy $MDV_DoDesktop "1"
  ${Else}
    StrCpy $MDV_DoDesktop "0"
  ${EndIf}

  ${NSD_GetState} $MDV_ChkTaskbar $0
  ${If} $0 == ${BST_CHECKED}
    StrCpy $MDV_DoTaskbar "1"
  ${Else}
    StrCpy $MDV_DoTaskbar "0"
  ${EndIf}
FunctionEnd

!macro customInstall
  ; Runs after electron-builder's default shortcut macros.
  ; Honor the user's checkbox choices: force create/update, or remove if unchecked.

  ${if} $MDV_DoStartMenu == "1"
    !insertmacro createMenuDirectory
    CreateShortCut "$newStartMenuLink" "$appExe" "" "$appExe" 0 "" "" "${APP_DESCRIPTION}"
    ClearErrors
    WinShell::SetLnkAUMI "$newStartMenuLink" "${APP_ID}"
  ${else}
    ${if} ${FileExists} "$newStartMenuLink"
      WinShell::UninstShortcut "$newStartMenuLink"
      Delete "$newStartMenuLink"
    ${endIf}
    ${if} ${FileExists} "$oldStartMenuLink"
    ${andIf} $oldStartMenuLink != $newStartMenuLink
      WinShell::UninstShortcut "$oldStartMenuLink"
      Delete "$oldStartMenuLink"
    ${endIf}
  ${endIf}

  ${if} $MDV_DoDesktop == "1"
    CreateShortCut "$newDesktopLink" "$appExe" "" "$appExe" 0 "" "" "${APP_DESCRIPTION}"
    ClearErrors
    WinShell::SetLnkAUMI "$newDesktopLink" "${APP_ID}"
    System::Call 'Shell32::SHChangeNotify(i 0x8000000, i 0, i 0, i 0)'
  ${else}
    ${if} ${FileExists} "$newDesktopLink"
      WinShell::UninstShortcut "$newDesktopLink"
      Delete "$newDesktopLink"
    ${endIf}
    ${if} ${FileExists} "$oldDesktopLink"
    ${andIf} $oldDesktopLink != $newDesktopLink
      WinShell::UninstShortcut "$oldDesktopLink"
      Delete "$oldDesktopLink"
    ${endIf}
  ${endIf}

  ${if} $MDV_DoTaskbar == "1"
    ; Best-effort pin via shell verb (often blocked on modern Windows)
    ${StdUtils.InvokeShellVerb} $R9 "$INSTDIR" "${APP_EXECUTABLE_FILENAME}" ${StdUtils.Const.ShellVerb.PinToTaskbar}
  ${endIf}
!macroend

!endif ; !BUILD_UNINSTALLER

!macro customUnInstall
  ; Best-effort unpin from taskbar on uninstall
  ${StdUtils.InvokeShellVerb} $R9 "$INSTDIR" "${APP_EXECUTABLE_FILENAME}" ${StdUtils.Const.ShellVerb.UnpinFromTaskbar}
!macroend
