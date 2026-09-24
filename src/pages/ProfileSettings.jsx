import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./ProfileSettings.css";

const ProfileSettings = () => {
  const { user } = useAuth();

  const [profile, setProfile] = useState({
    firstName:
      user?.firstName ||
      user?.name?.split(" ")[0] ||
      "",

    lastName:
      user?.lastName ||
      user?.name?.split(" ").slice(1).join(" ") ||
      "",

    email: user?.email || "",
    phone: user?.phone || "",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswords((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async (e) => {
  e.preventDefault();

  setProfileMessage("");

  if (!profile.firstName.trim()) {
    setProfileMessage(
      "Please enter your first name."
    );
    return;
  }

  if (!profile.email.trim()) {
    setProfileMessage(
      "Please enter your email address."
    );
    return;
  }

  try {
    setSavingProfile(true);

    const response = await api(
      "/auth/profile",
      {
        method: "PUT",
        body: JSON.stringify({
          firstName:
            profile.firstName.trim(),

          lastName:
            profile.lastName.trim(),

          email:
            profile.email.trim(),

          phone:
            profile.phone.trim(),
        }),
      }
    );

    /*
     * The backend returns the updated AuthResponse.
     *
     * If your AuthContext exposes a setUser/updateUser
     * function, use it here.
     */
    if (response) {
      setProfile({
        firstName:
          response.name?.split(" ")[0] ||
          profile.firstName,

        lastName:
          response.name
            ?.split(" ")
            .slice(1)
            .join(" ") ||
          profile.lastName,

        email:
          response.email ||
          profile.email,

        phone:
          response.mobile ||
          profile.phone ||
          "",
      });
    }

    setProfileMessage(
      "Your profile has been updated successfully."
    );

  } catch (error) {

    setProfileMessage(
      error?.message ||
        "Unable to update your profile. Please try again."
    );

  } finally {
    setSavingProfile(false);
  }
};

  const handlePasswordSubmit = async (e) => {
  e.preventDefault();

  setPasswordMessage("");

  if (!passwords.currentPassword) {
    setPasswordMessage(
      "Please enter your current password."
    );
    return;
  }

  if (!passwords.newPassword) {
    setPasswordMessage(
      "Please enter a new password."
    );
    return;
  }

  if (passwords.newPassword.length < 6) {
    setPasswordMessage(
      "Your new password must contain at least 6 characters."
    );
    return;
  }

  if (
    passwords.newPassword !==
    passwords.confirmPassword
  ) {
    setPasswordMessage(
      "New passwords do not match."
    );
    return;
  }

  try {

    setChangingPassword(true);

    const response = await api(
      "/auth/change-password",
      {
        method: "PUT",
        body: JSON.stringify({
          currentPassword:
            passwords.currentPassword,

          newPassword:
            passwords.newPassword,

          confirmPassword:
            passwords.confirmPassword,
        }),
      }
    );

    setPasswordMessage(
      response?.message ||
        "Your password has been changed successfully."
    );

    setPasswords({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);

  } catch (error) {

    setPasswordMessage(
      error?.message ||
        "Unable to change your password. Please try again."
    );

  } finally {

    setChangingPassword(false);
  }
};

  const getInitials = () => {
    const first = profile.firstName?.charAt(0) || "";
    const last = profile.lastName?.charAt(0) || "";

    return `${first}${last}`.toUpperCase() || "U";
  };

  return (
    <div className="profile-settings-page">

      {/* PAGE HERO */}
      <section className="profile-settings-hero">
        <div className="profile-settings-hero-content">
          <span className="profile-settings-eyebrow">
            ACCOUNT SETTINGS
          </span>

          <h1>Profile Settings</h1>

          <p>
            Manage your personal information, account details and security
            preferences.
          </p>
        </div>

        <div className="profile-settings-hero-decoration">
          <span>“</span>
          <strong>
            Your account,
            <br />
            your journey.
          </strong>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="profile-settings-layout">

        {/* LEFT PROFILE CARD */}
        <aside className="profile-preview-card">

          <div className="profile-preview-top">
            <div className="profile-avatar-large">
              {getInitials()}
            </div>

            <span className="profile-active-dot"></span>
          </div>

          <h2>
            {profile.firstName || "Your"}{" "}
            {profile.lastName || ""}
          </h2>

          <p className="profile-preview-email">
            {profile.email || "your@email.com"}
          </p>

          <div className="profile-preview-divider"></div>

          <div className="profile-preview-info">

            <div className="profile-info-row">
              <span className="profile-info-icon">✦</span>

              <div>
                <small>ACCOUNT</small>
                <strong>Personal</strong>
              </div>
            </div>

            <div className="profile-info-row">
              <span className="profile-info-icon">✓</span>

              <div>
                <small>STATUS</small>
                <strong className="profile-status">
                  Active
                </strong>
              </div>
            </div>

          </div>

          <div className="profile-preview-quote">
            <span>“</span>

            <p>
              A reader today,
              <br />
              a brighter tomorrow.
            </p>
          </div>
        </aside>

        {/* RIGHT CONTENT */}
        <main className="profile-settings-content">

          {/* PERSONAL INFORMATION */}
          <section className="profile-settings-card">

            <div className="profile-card-heading">

              <div className="profile-heading-icon">
                ♙
              </div>

              <div>
                <span>PERSONAL INFORMATION</span>

                <h2>
                  Your profile
                </h2>

                <p>
                  Keep your personal information up to date.
                </p>
              </div>

            </div>

            <form onSubmit={handleProfileSubmit}>

              <div className="profile-form-grid">

                <div className="profile-field">
                  <label htmlFor="firstName">
                    First name
                  </label>

                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={profile.firstName}
                    onChange={handleProfileChange}
                    placeholder="Enter your first name"
                  />
                </div>

                <div className="profile-field">
                  <label htmlFor="lastName">
                    Last name
                  </label>

                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={profile.lastName}
                    onChange={handleProfileChange}
                    placeholder="Enter your last name"
                  />
                </div>

                <div className="profile-field profile-field-full">
                  <label htmlFor="email">
                    Email address
                  </label>

                  <div className="profile-input-with-icon">
                    <span>✉</span>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={profile.email}
                      onChange={handleProfileChange}
                      placeholder="Enter your email"
                    />
                  </div>

                  <small className="profile-field-help">
                    This is the email address associated with your account.
                  </small>
                </div>

                <div className="profile-field profile-field-full">
                  <label htmlFor="phone">
                    Phone number
                  </label>

                  <div className="profile-input-with-icon">
                    <span>☎</span>

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={profile.phone}
                      onChange={handleProfileChange}
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                </div>

              </div>

              {profileMessage && (
                <div
                  className={`profile-message ${
                    profileMessage.includes("successfully")
                      ? "profile-message-success"
                      : "profile-message-error"
                  }`}
                >
                  <span>
                    {profileMessage.includes("successfully")
                      ? "✓"
                      : "!"}
                  </span>

                  {profileMessage}
                </div>
              )}

              <div className="profile-form-actions">
                <button
                  type="button"
                  className="profile-secondary-button"
                  onClick={() =>
                    setProfile({
                      firstName:
                        user?.firstName ||
                        user?.name?.split(" ")[0] ||
                        "",
                      lastName:
                        user?.lastName ||
                        user?.name?.split(" ").slice(1).join(" ") ||
                        "",
                      email: user?.email || "",
                      phone: user?.phone || "",
                    })
                  }
                >
                  Reset
                </button>

                <button
                  type="submit"
                  className="profile-primary-button"
                  disabled={savingProfile}
                >
                  {savingProfile
                    ? "Saving..."
                    : "Save changes"}
                </button>
              </div>

            </form>

          </section>

          {/* SECURITY */}
          <section className="profile-settings-card">

            <div className="profile-card-heading">

              <div className="profile-heading-icon">
                🔒
              </div>

              <div>
                <span>ACCOUNT SECURITY</span>

                <h2>
                  Password & security
                </h2>

                <p>
                  Keep your account protected with a strong password.
                </p>
              </div>

            </div>

            <form onSubmit={handlePasswordSubmit}>

              <div className="profile-password-fields">

                <div className="profile-field">
                  <label htmlFor="currentPassword">
                    Current password
                  </label>

                  <div className="password-input-wrapper">

                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type={
                        showCurrentPassword
                          ? "text"
                          : "password"
                      }
                      value={passwords.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowCurrentPassword(
                          (prev) => !prev
                        )
                      }
                      aria-label="Toggle password visibility"
                    >
                      {showCurrentPassword ? "◉" : "○"}
                    </button>

                  </div>
                </div>

                <div className="profile-field">
                  <label htmlFor="newPassword">
                    New password
                  </label>

                  <div className="password-input-wrapper">

                    <input
                      id="newPassword"
                      name="newPassword"
                      type={
                        showNewPassword
                          ? "text"
                          : "password"
                      }
                      value={passwords.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Create new password"
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowNewPassword(
                          (prev) => !prev
                        )
                      }
                      aria-label="Toggle password visibility"
                    >
                      {showNewPassword ? "◉" : "○"}
                    </button>

                  </div>

                  <small className="profile-field-help">
                    Use at least 6 characters.
                  </small>
                </div>

                <div className="profile-field">
                  <label htmlFor="confirmPassword">
                    Confirm new password
                  </label>

                  <div className="password-input-wrapper">

                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={passwords.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowConfirmPassword(
                          (prev) => !prev
                        )
                      }
                      aria-label="Toggle password visibility"
                    >
                      {showConfirmPassword ? "◉" : "○"}
                    </button>

                  </div>
                </div>

              </div>

              {passwordMessage && (
                <div
                  className={`profile-message ${
                    passwordMessage.includes("successfully")
                      ? "profile-message-success"
                      : "profile-message-error"
                  }`}
                >
                  <span>
                    {passwordMessage.includes("successfully")
                      ? "✓"
                      : "!"}
                  </span>

                  {passwordMessage}
                </div>
              )}

              <div className="profile-form-actions">
                <button
                  type="submit"
                  className="profile-primary-button"
                  disabled={changingPassword}
                >
                  {changingPassword
                    ? "Updating..."
                    : "Change password"}
                </button>
              </div>

            </form>

          </section>

          {/* SECURITY NOTE */}
          <section className="profile-security-note">

            <div className="profile-security-note-icon">
              ✓
            </div>

            <div>
              <h3>
                Keep your account secure
              </h3>

              <p>
                Never share your password with anyone. We will never
                ask you for your password through email, phone or
                social media.
              </p>
            </div>

          </section>

        </main>

      </div>
    </div>
  );
};

export default ProfileSettings;