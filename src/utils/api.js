import axios from 'axios'

let base = '';
export const postRequest = (url, params, header) => {
  header = header ? header == "JSON" ?  "'Content-Type': 'application/json'" : "'Content-Type': 'application/x-www-form-urlencoded'" : "'Content-Type': 'application/x-www-form-urlencoded'";
  return axios({
    method: 'post',
    url: `${base}${url}`,
    data: params,
    transformRequest: [function (data) {
      // Do whatever you want to transform the data
      let ret = ''
      for (let it in data) {
        ret += encodeURIComponent(it) + '=' + encodeURIComponent(data[it]) + '&'
      }
      return ret
    }],
    headers: { header }
  });
}
export const uploadFileRequest = (url, params) => {
  return axios({
    method: 'post',
    url: `${base}${url}`,
    data: params,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

export const putRequest = (url, params, header) => {
  header = header ? header == "JSON" ?  "'Content-Type': 'application/json'" : "'Content-Type': 'application/x-www-form-urlencoded'" : "'Content-Type': 'application/x-www-form-urlencoded'";
  console.log("header=============", header)
  return axios({
    method: 'put',
    url: `${base}${url}`,
    data: params,
    transformRequest: [function (data) {
      if(header != "JSON"){
        let ret = ''
        for (let it in data) {
          ret += encodeURIComponent(it) + '=' + encodeURIComponent(data[it]) + '&'
        }
        return ret
      } else{
        return JSON.stringify(data);
      }
    }],
    headers: { header }
  });
}
export const deleteRequest = (url) => {
  return axios({
    method: 'delete',
    url: `${base}${url}`
  });
}
export const getRequest = (url,params) => {
  return axios({
    method: 'get',
    params:params,
    transformRequest: [function (data) {
      let ret = ''
      for (let it in data) {
        ret += encodeURIComponent(it) + '=' + encodeURIComponent(data[it]) + '&'
      }
      return ret
    }],
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    url: `${base}${url}`
  });
}
