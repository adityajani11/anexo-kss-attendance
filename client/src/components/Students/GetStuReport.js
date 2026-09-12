import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const GetStuReport = () => {
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!barcode) {
      setError("Please enter a barcode.");
      return;
    }
    setError(null);
    navigate(`/calendar-view/${barcode}`);
  };

  return (
    <div className="container">
      <h5 className="text-center alert alert-primary m-2 mb-3" role="alert">
        <strong>STUDENT ATTENDANCE REPORT</strong>
      </h5>
      <div className="row">
        <div className="col-md-6 offset-md-3">
          <form>
            {error && (
              <div className="alert alert-warning" role="alert">
                {error}
              </div>
            )}
            <input
              type="text"
              id="getBarcode"
              placeholder="Barcode starts with KSS"
              pattern="KSS\d{7}"
              title="Correct format is KSS followed by 7 digits."
              className="form-control mb-2"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value.toUpperCase())}
              maxLength="10"
              onInput={(e) => (e.target.value = e.target.value.toUpperCase())}
              required
            />
            <div className="text-center">
              <button type="submit"
                className="btn btn-primary mt-2 w-50"
                onClick={handleSubmit}
              >
                <span>
                  <i className="fa fa-clipboard-list me-2" aria-hidden="true"></i>
                  Get Attendance Report
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GetStuReport;
