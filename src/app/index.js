import "antd/dist/antd.css";
import React, { useEffect, useRef, useState } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { Button, Input, Space, Table } from "antd";
import Highlighter from "react-highlight-words";
import moment from "moment/moment";
import axios from "axios";

async function getData() {
  try {
    const response = await axios.get("http://localhost:8080/api/users/");
    return response.data;
  } catch (error) {
    console.log(error);
  }
}

const App = () => {
  const [data, setData] = useState([]);
  const [dataSource, setDataSource] = useState([]);

  useEffect(() => {
    async function getResponse() {
      const data = await getData();
      setData(data);
    }
    getResponse();
  }, []);

  const daysSet = new Set();

  for (let user of data) {
    for (let day of user.Days) {
      daysSet.add(day.Date);
    }
  }
  const days = Array.from(daysSet).sort();

  useEffect(() => {
    if (data && data?.length > 0) {
      function addTime(user) {
        const newArray = [];

        function getTime(item) {
          const time = moment
            .duration(item.End.replace("-", ":"))
            .subtract(moment.duration(item.Start.replace("-", ":")));

          return time.hours() + ":" + time.minutes();
        }

        for (let day of days) {
          const item = user?.Days?.find((el) => el?.Date === day);
          if (item) {
            newArray.push({ Date: day, time: getTime(item) });
          } else {
            newArray.push({ Date: day, time: "0" });
          }
        }
        return { id: user?.id, Fullname: user?.Fullname, Days: newArray };
      }

      function addTotal(user) {
        let sum = moment.duration("00:00");

        for (let i = 0; i < user.Days.length; i++) {
          sum = sum.add(moment.duration(user.Days[i].time));
        }
        let Total = 24 * sum.days() + sum.hours() + ":" + sum.minutes();
        return {
          id: user?.id,
          Fullname: user?.Fullname,
          Days: user?.Days,
          Total,
        };
      }

      function addDaysTime(user) {
        return user.Days.reduce(
          (acc, el) => {
            return { ...acc, [el.Date]: el.time };
          },
          { id: user?.id, Fullname: user?.Fullname, Total: user?.Total }
        );
      }

      setDataSource(
        data
          .map((user) => {
            return addTime(user);
          })
          .map((user) => {
            return addTotal(user);
          })
          .map((user) => {
            return addDaysTime(user);
          })
      );
    }
  }, [data]);

  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };
  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText("");
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div
        style={{
          padding: 8,
        }}
      >
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{
            marginBottom: 8,
            display: "block",
          }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{
              width: 90,
            }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{
              width: 90,
            }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined
        style={{
          color: filtered ? "#1890ff" : undefined,
        }}
      />
    ),
    onFilter: (value, record) =>
      record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    onFilterDropdownVisibleChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{
            backgroundColor: "#ffc069",
            padding: 0,
          }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });
  const columns = [
    {
      key: "Fullname",
      title: "User",
      dataIndex: "Fullname",
      fixed: "left",
      width: 150,
      ...getColumnSearchProps("Fullname"),
    },
  ];
  for (let day of days) {
    columns.push({
      key: day,
      title: +day.split("-")[2],
      dataIndex: day,
      width: 80,
      sorter: (a, b) =>
        moment.duration(a[day]).subtract(moment.duration(b[day])),
    });
  }
  columns.push({
    key: "Total",
    title: "Total",
    dataIndex: "Total",
    fixed: "right",
    width: 100,
    sorter: (a, b) =>
      moment.duration(a.Total).subtract(moment.duration(b.Total)),
  });

  return (
    <div>
      <Table
        dataSource={dataSource}
        columns={columns}
        scroll={{
          x: 1000,
        }}
      />
    </div>
  );
};

export { App };
