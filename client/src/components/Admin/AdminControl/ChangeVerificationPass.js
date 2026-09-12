import React from "react";
import ChangePassword from "../../Utils/ChangePassword";

const ChangeVerificationPass = () => {
  return (
    <ChangePassword
      title="CHANGE VERIFICATION PASSWORD"
      apiValidateEndpoint="/api/admin/validate"
      apiChangePasswordEndpoint="/api/admin/changeVerificationPassword"
      passwordLabel="Verification Password"
    />
  );
};

export default ChangeVerificationPass;
