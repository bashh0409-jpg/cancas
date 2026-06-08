"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Settings, User, Loader2 } from "lucide-react";
import { DeleteAccountModal } from "@/app/components/home/DeleteAccountModal";

type AccountTab = "profile" | "settings";

type Profile = {
  firstName: string;
  lastName: string;
  email: string;
  nickname?: string | null;
};

const TABS: { id: AccountTab; label: string; icon: React.ReactNode }[] = [
  {
    id: "profile",
    label: "Profile",
    icon: <User className="w-5 h-5" />,
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings className="w-5 h-5" />,
  },
];

export function AccountPage({
  profile,
  updateNicknameAction,
  deleteAccountAction,
  signOut,
}: {
  profile: Profile;
  updateNicknameAction: (formData: FormData) => Promise<void>;
  deleteAccountAction: () => Promise<void>;
  signOut: () => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<AccountTab>("profile");

  const safeProfile = profile ?? {
    nickname: "",
    firstName: "",
    lastName: "",
    email: "",
  };

  const fullName =
    safeProfile.nickname?.trim() ||
    `${safeProfile.firstName} ${safeProfile.lastName}`.trim();

  return (
    <div className="flex items-start justify-center min-h-full pt-16 pb-16">
      <div className="flex gap-12">
        {/* back */}
        <a
          href="/home"
          className="text-black items-center flex justify-center rounded h-7 w-7 bg-white shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </a>

        {/* nav */}
        <nav className="flex flex-col gap-0.5 w-50 shrink-0 pt-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2.5 px-2 py-1.5 h-10 rounded-md tracking-tight text-left transition-colors
                ${
                  activeTab === tab.id
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                }
              `}
            >
              {tab.icon}
              <span className="text-sm">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* divider */}
        <div className="w-px bg-white/5 self-stretch" />

        {/* content */}
        <div className="w-[700px]">
          <h1 className="text-white text-base font-medium mb-6">
            {TABS.find((t) => t.id === activeTab)?.label}
          </h1>

          {activeTab === "profile" && (
            <ProfileTab
              profile={safeProfile}
              fullName={fullName}
              updateNicknameAction={updateNicknameAction}
            />
          )}

          {activeTab === "settings" && (
            <SettingsTab
              deleteAccountAction={deleteAccountAction}
              signOut={signOut}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileTab({
  profile,
  fullName,
  updateNicknameAction,
}: {
  profile: Profile;
  fullName: string;
  updateNicknameAction: (formData: FormData) => Promise<void>;
}) {
  const initialName = profile?.nickname?.trim() || fullName;

  const [nickname, setNickname] = useState(initialName);
  const [displayName, setDisplayName] = useState(initialName);

  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaved(false);

    const trimmed = nickname.trim();

    if (!trimmed) return;

    const formData = new FormData();
    formData.append("nickname", trimmed);

    startTransition(async () => {
      await updateNicknameAction(formData);

      // why: reflect latest nickname instantly without refresh
      setDisplayName(trimmed);

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2000);
    });
  }

  return (
    <div className="flex max-w-lg flex-col gap-8">
      {/* avatar */}
      <div className="flex items-center gap-5">
        <div className="lime flex h-24 w-24 shrink-0 items-center justify-center rounded-md border border-white/10">
          <span className="text-2xl font-medium text-black">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="flex flex-col">
          <h2 className="text-lg tracking-tight text-white">{displayName}</h2>

          <p className="text-sm text-white/40">Personal account settings</p>
        </div>
      </div>

      {/* fields */}
      <div className="flex flex-col gap-4">
        {/* nickname */}
        <div className="flex flex-col gap-2 text-white">
          <span className="text-xs text-white">Display Name</span>

          <div className="flex items-center gap-2">
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter nickname"
              className="
                h-9 w-full max-w-80
                rounded border border-transparent
                bg-[#212529]
                px-3
                text-xs text-white mono
                outline-none
                focus:border-white/10
              "
            />

            <button
              onClick={handleSave}
              disabled={pending}
              className="
                flex h-9 min-w-[72px] items-center justify-center
                rounded bg-white px-3
                text-xs font-medium text-black
                transition hover:bg-white/90
                disabled:opacity-50
              "
            >
              {pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : saved ? (
                "Saved"
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>

        {/* email */}
        <div className="flex flex-col gap-2 text-white">
          <span className="text-xs text-white">Email</span>

          <div className="flex h-9 max-w-80 items-center rounded bg-[#212529] px-3 text-xs text-white/70 mono">
            {profile?.email ?? "No email"}
          </div>
        </div>

        {/* role */}
        <div className="flex flex-col gap-2 text-white">
          <span className="text-xs text-white">Role</span>

          <div className="flex h-9 max-w-80 items-center rounded bg-[#212529] px-3 text-xs text-white/70 mono">
            User
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsTab({
  deleteAccountAction,
  signOut,
}: {
  deleteAccountAction: () => Promise<void>;
  signOut: () => Promise<void>;
}) {
  const router = useRouter();
  const [openDelete, setOpenDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canDelete = confirmText.trim() === "Yes i want to delete my account";

  async function handleDeleteAccount(confirmText: string) {
    const canDelete = confirmText.trim() === "Yes i want to delete my account";
    if (!canDelete) return;

    setDeleting(true);
    setDeleteError(null);
    setOpenDelete(false);

    try {
      await deleteAccountAction();
      await signOut();
      router.push("/signin");
      setConfirmText("");
    } catch (error) {
      setDeleting(false);
      setDeleteError(
        error instanceof Error
          ? error.message
          : String(error) || "Unable to delete account.",
      );
      setOpenDelete(true);
    }
  }

  return (
    <>
      <div className="flex max-w-xl flex-col gap-8">
        {/* header */}
        <div className="flex flex-col gap-1">
          <h2 className="text-lg tracking-tight text-white">
            Workspace Settings
          </h2>

          <p className="text-sm text-white/40">
            Manage your plan, notifications, and account preferences.
          </p>
        </div>

        {/* plan */}
        <div className="flex flex-col gap-4">
          <span className="text-xs text-white">Plan</span>

          <div className="flex flex-col gap-4 rounded border border-white/10 bg-[#212529] p-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">Free</span>

                <span className="text-xs text-white/40">
                  Limited canvas creation · 50 credits / month
                </span>
              </div>

              <button className="h-9 rounded bg-white px-3 text-xs font-medium text-black transition hover:bg-white/90">
                Upgrade
              </button>
            </div>
          </div>
        </div>

        {/* notifications */}
        <div className="flex flex-col gap-4">
          <span className="text-xs text-white">Notifications</span>

          <div className="flex flex-col rounded border border-white/10 bg-[#212529] p-3">
            <Toggle
              label="Product updates"
              description="New features and announcements"
              defaultChecked
            />

            <div className="h-px bg-white/5" />

            <Toggle
              label="Canvas activity"
              description="Comments and edits on your canvases"
              defaultChecked
            />

            <div className="h-px bg-white/5" />

            <Toggle
              label="Marketing emails"
              description="Tips, tutorials and offers"
            />
          </div>
        </div>

        {/* danger zone */}
        <div className="flex flex-col gap-4">
          <span className="text-xs text-white">Danger zone</span>

          <div className="flex items-center justify-between rounded border border-rose-500/20 bg-[#212529] p-4">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">
                Delete account
              </span>

              <span className="text-xs text-white/40">
                Permanently removes all your files and account data.
              </span>
            </div>

            <button
              onClick={() => setOpenDelete(true)}
              className="h-9 cursor-pointer rounded border border-rose-500/30 px-3 text-xs font-medium text-rose-400 transition hover:bg-rose-500/10"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <DeleteAccountModal
        open={openDelete}
        onClose={() => {
          if (!deleting) {
            setOpenDelete(false);
            setConfirmText("");
            setDeleteError(null);
          }
        }}
        onConfirm={handleDeleteAccount}
      />

      {deleteError ? (
        <div className="mt-4 rounded border border-rose-500/50 bg-rose-500/10 p-3 text-xs text-rose-200">
          {deleteError}
        </div>
      ) : null}

      {deleting ? (
        <div
          aria-label="Deleting account"
          aria-live="polite"
          className="fixed inset-0 z-[1000] grid place-items-center bg-black"
          role="status"
        >
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/25 border-t-white" />
        </div>
      ) : null}
    </>
  );
}

function Toggle({
  label,
  description,
  defaultChecked = false,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  const [on, setOn] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-white text-sm">{label}</p>

        <p className="text-white/40 text-xs mt-0.5">{description}</p>
      </div>

      <button
        onClick={() => setOn((v) => !v)}
        className={`relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 ${
          on ? "bg-white" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-200 ${
            on ? "translate-x-4 bg-black" : "bg-white/40"
          }`}
        />
      </button>
    </div>
  );
}
