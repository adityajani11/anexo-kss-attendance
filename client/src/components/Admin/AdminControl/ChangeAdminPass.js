import React from "react";
import ChangePassword from "../../Utils/ChangePassword";

const ChangeAdminPass = () => {
  return (
    <ChangePassword
      title="CHANGE PASSWORD"
      apiValidateEndpoint="/api/admin/validate"
      apiChangePasswordEndpoint="/api/admin/changePassword"
      passwordLabel="Admin Password"
    />
  );
};

export default ChangeAdminPass;
