import React, { useState, useEffect } from 'react';
import "../loader.css";

const ViewAttendance = () => {
  const [data, setData] = useState(null); // Initialize with null for proper conditional rendering
  const [error, setError] = useState(null); // For handling errors
  const [loading, setLoading] = useState(false); // Loading state to control fetch status

  useEffect(() => {
    fetchData(); // Fetch data when component mounts
  }, []);

  const fetchData = () => {
    setLoading(true); // Set loading to true before data fetching
    fetch(`${process.env.REACT_APP_API_URL}/api/attendance/get/today`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          // Parse the JSON response to extract the error message
          return response.json().then((error) => {
            throw new Error(error.message || 'Failed to fetch data');
          });
        }
        return response.json();
      })
      .then((fetchedData) => {
        setData(fetchedData);
        setLoading(false); // Set loading to false after data is fetched
      })
      .catch((error) => {
        setError(error.message); // Set error message
        setLoading(false); // Set loading to false even if there's an error
      });
  };

  const handleRefresh = () => {
    fetchData();
  };

  if (error) {
    return (
      <div className="alert alert-danger m-2 text-center">
        <strong>
          {error}
        </strong>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="alert alert-primary text-center m-2">
        <div className="loader-container">
          <div className="loader"></div>
        </div>
        <p className="fw-bold">Data is being fetched...</p>
      </div>
    );
  }

  if (!data || (!data.categorizedData["9"] && !data.categorizedData["10"])) {
    return (
      <div className="alert alert-danger text-center">
        <i className="fa fa-exclamation-triangle me-2" aria-hidden="true"></i>
        <strong>No data available.</strong>
      </div>
    );
  }

  const categorizedData9 = data.categorizedData?.["9"];
  const categorizedData10 = data.categorizedData?.["10"];

  return (
    <div className="container bg-light rounded p-3">
      <button className="btn btn-secondary mb-3" onClick={handleRefresh}>
        <i className="fa fa-refresh me-2" aria-hidden="true"></i>
        Refresh Data
      </button>

      <div className="row">
        {/* Class 9 Present Data */}
        <div className="col-md-6">
          {categorizedData9 && (
            <>
              <div className="alert alert-success">
                <strong>Class: 09 - Total Present: {categorizedData9.PRESENT.length}</strong>
              </div>
              {categorizedData9.PRESENT.length === 0 ? (
                <div className="alert alert-warning">No present data found for Class 9.</div>
              ) : (
                <div className="table-responsive">
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table className="table table-striped table-bordered">
                      <thead className="thead-dark">
                        <tr>
                          <th>SR. No</th>
                          <th>Barcode</th>
                          <th>Name [PRESENT]</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categorizedData9.PRESENT.map((student, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{student.barcode}</td>
                            <td>{student.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Class 9 Absent Data */}
        <div className="col-md-6">
          {categorizedData9 && (
            <>
              <div className="alert alert-danger">
                <strong>Class: 09 - Total Absent: {categorizedData9.ABSENT.length}</strong>
              </div>
              {categorizedData9.ABSENT.length === 0 ? (
                <div className="alert alert-warning">No absent data found for Class 9.</div>
              ) : (
                <div className="table-responsive">
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table className="table table-striped table-bordered">
                      <thead className="thead-dark">
                        <tr>
                          <th>SR. No</th>
                          <th>Barcode</th>
                          <th>Name [ABSENT]</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categorizedData9.ABSENT.map((student, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{student.barcode}</td>
                            <td>{student.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <hr />

        {/* Class 10 Present Data */}
        <div className="col-md-6">
          {categorizedData10 && (
            <>
              <div className="alert alert-success">
                <strong>Class: 10 - Total Present: {categorizedData10.PRESENT.length}</strong>
              </div>
              {categorizedData10.PRESENT.length === 0 ? (
                <div className="alert alert-warning">No present data found for Class 10.</div>
              ) : (
                <div className="table-responsive">
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table className="table table-striped table-bordered">
                      <thead className="thead-dark">
                        <tr>
                          <th>SR. No</th>
                          <th>Barcode</th>
                          <th>Name [PRESENT]</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categorizedData10.PRESENT.map((student, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{student.barcode}</td>
                            <td>{student.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Class 10 Absent Data */}
        <div className="col-md-6">
          {categorizedData10 && (
            <>
              <div className="alert alert-danger">
                <strong>Class: 10 - Total Absent: {categorizedData10.ABSENT.length}</strong>
              </div>
              {categorizedData10.ABSENT.length === 0 ? (
                <div className="alert alert-warning">No absent data found for Class 10.</div>
              ) : (
                <div className="table-responsive">
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table className="table table-striped table-bordered">
                      <thead className="thead-dark">
                        <tr>
                          <th>SR. No</th>
                          <th>Barcode</th>
                          <th>Name [ABSENT]</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categorizedData10.ABSENT.map((student, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{student.barcode}</td>
                            <td>{student.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewAttendance;
