import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";
import "../style/Dashboard.css";
import "../loader.css";

const AdminDashboard = () => {
  const [data, setData] = useState({
    totalStudents: 0,
    class9: { studentCount: 0, presentCount: 0, absentCount: 0 },
    class10: { studentCount: 0, presentCount: 0, absentCount: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: responseData } = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/students/counts/all`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            }
          }
        );
        setData({
          totalStudents: responseData.totalStudents,
          class9: responseData.classDetails["9"],
          class10: responseData.classDetails["10"],
        });
      } catch {
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="loader-container mt-5">
        <div className="loader"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger text-center mt-5">
        <strong>{error}</strong>
      </div>
    );
  }

  const totalPresent = (data?.class9?.presentCount || 0) + (data?.class10?.presentCount || 0);
  const totalAbsent = (data?.totalStudents || 0) - totalPresent;

  const pieChartData = {
    labels: ["Present", "Absent"],
    datasets: [
      {
        data: [totalPresent, totalAbsent],
        backgroundColor: ["#36A2EB", "#FF6384"],
        hoverBackgroundColor: ["#36A2EB", "#FF6384"],
        borderColor: ["#ffffff", "#ffffff"],
        borderWidth: 3,
        cutout: '70%',
      },
    ],
  };

  const pieChartOptions = {
    plugins: {
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            const dataset = tooltipItem.dataset;
            const total = dataset.data.reduce((a, b) => a + b, 0);
            const value = dataset.data[tooltipItem.dataIndex];
            const percentage = ((value / total) * 100).toFixed(2) + '%';
            const label = tooltipItem.label || "";
            return `${label}: ${value} (${percentage})`;
          },
        },
      },
      legend: {
        labels: {
          usePointStyle: true,
          boxWidth: 15,
          color: "#ffffff",
        },
      },
    },
  };

  const cardData = [
    {
      title: "Total Students",
      value: data?.totalStudents || 0,
      icon: "fa-users-line",
      bgClass: "bg-gradient-total-student",
    },
    {
      title: "Class 9 Students",
      value: data?.class9?.studentCount || 0,
      subTitle: `Present: ${data?.class9?.presentCount || 0} | Absent: ${data?.class9?.absentCount || 0}`,
      icon: "fa-chalkboard",
      bgClass: "bg-gradient-class9",
    },
    {
      title: "Class 10 Students",
      value: data?.class10?.studentCount || 0,
      subTitle: `Present: ${data?.class10?.presentCount || 0} | Absent: ${data?.class10?.absentCount || 0}`,
      icon: "fa-chalkboard",
      bgClass: "bg-gradient-class10",
    },
  ];

  return (
    <div className="container">
      <div className="row">
        
        {/* Left side: Card Data */}
        <div className="col-12 col-md-6 col-lg-6 mb-3">
          <div className="column justify-content-evenly">
            {cardData.map((card, index) => (
              <div className="col-12 mb-3" key={index}>
                <motion.div
                  className={`custom-card ${card.bgClass}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.2 }}
                >
                  <div className="custom-card-body">
                    <div className="custom-card-details">
                      <h3 className="custom-card-value mb-3">{card.value}</h3>
                      <p className="custom-card-title">{card.title}</p>
                      {card.subTitle && <p className="custom-card-subtitle">{card.subTitle}</p>}
                    </div>
                    <i className={`fa ${card.icon} custom-card-icon`}></i>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side: Pie Chart */}
        <div className="col-12 col-md-6 col-lg-6">
          <motion.div
            className="custom-card bg-gradient-pie"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.6 }}
          >
            <div className="custom-card-body">
              <div className="custom-card-details">
                <h3 className="custom-card-value mb-3">{totalPresent}</h3>
                <p className="custom-card-title">Overall Present Attendance</p>
                <Pie
                  data={pieChartData}
                  options={pieChartOptions}
                  width={150}
                  height={150}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
