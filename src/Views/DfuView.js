import React, { Component } from "react";
import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import Input from "@material-ui/core/Input";
import FCConnector from "../utilities/FCConnector";
import CliView from "./CliView/CliView";
import ReactMarkdown from "react-markdown";
import HelperSelect from "./Items/HelperSelect";
import Typography from "@material-ui/core/Typography";
import { FormattedMessage } from "react-intl";

export default class DfuView extends Component {
  constructor(props) {
    super(props);
    this.cliNotice =
      '\n\n**********<h1>YOU ARE IN DFU MODE.\nDO NOT UNPLUG YOUR DEVICE UNTIL FLASHING IS COMPLETE OR YOU\'RE GONNA HAVE A BAD TIME.</h1><img id="pbjt" src="assets/dfu.gif" height="90" width="90"/><br/>#flyhelio\n**********\n\n';
    this.state = {
      theme: props.theme,
      allowUpload: true,
      selectedFile: undefined,
      current: "",
      currentTarget: props.target || "",
      progress: "",
      hasTarget: !!props.target,
      targetItems: [
        "",
        "HELIOSPRING",
        "-REDACTED-M2-",
        "-REDACTED-F10-",
        "-REDACTED-KIA-"
      ],
      items: []
    };

    let isProgressStarted = false;
    FCConnector.webSockets.addEventListener("message", message => {
      try {
        let notification = JSON.parse(message.data);
        if (notification.progress) {
          if (!this.refs.cliView.state.open) {
            this.setState({ isFlashing: true });
            this.refs.cliView.setState({ open: true });
          }
          let idxprct = notification.progress.indexOf("%");
          let haspercent = idxprct > -1;
          if (isProgressStarted && haspercent) {
            // let pct = parseInt(notification.progress.slice(idxprct - 3, idxprct), 10);
            // document.getElementById('pbjt').style.transform = `translateX(${pct})`;
            this.refs.cliView.replaceLast(
              this.cliNotice + notification.progress
            );
          } else {
            isProgressStarted = haspercent;
            this.refs.cliView.appendCliBuffer(notification.progress);
          }
        }
      } catch (ex) {
        console.warn(ex);
      }
    });

    this.goBack = props.goBack;
  }
  loadLocalFile = event => {
    var data = new FormData();
    data.append("bin", event.target.files[0]);
    this.setState({ currentTarget: "", selectedFile: data });
  };

  handleFlash() {
    this.refs.cliView.setState({ open: true, stayOpen: true, disabled: true });
    this.setState({ isFlashing: true });
    let promise;
    if (this.state.selectedFile) {
      promise = FCConnector.flashDFULocal(this.state.selectedFile);
    } else {
      promise = FCConnector.flashDFU(this.state.current);
    }
    promise
      .then(done => {
        this.setState({ isFlashing: false, note: done });
      })
      .catch(error => {
        this.setState({ progress: "Unable to load file" });
        localStorage.clear();
      });
  }
  get releasesKey() {
    return "firmwareReleases";
  }
  get releaseUrl() {
    return "https://api.github.com/repos/heliorc/imuf_dev_repo/contents";
  }

  get releaseNotesUrl() {
    return "https://raw.githubusercontent.com/heliorc/imuf-release/master/README.md";
  }

  setFirmware(data) {
    let firmwares = data
      .filter(
        file => file.name.endsWith(".bin") && !file.name.startsWith("IMUF")
      )
      .reverse();
    firmwares.unshift("");
    this.setState({
      items: firmwares,
      isFlashing: false
    });
  }

  fetchReleases() {
    return fetch(this.releaseUrl)
      .then(response => response.json())
      .then(releases => {
        localStorage.setItem(
          this.releasesKey + "Expires",
          new Date().getTime() + 1 * 24 * 60 * 60 * 1000
        );
        localStorage.setItem(this.releasesKey, JSON.stringify(releases));
        this.setFirmware(releases);
        return releases;
      });
  }

  componentDidMount() {
    fetch(this.releaseNotesUrl)
      .then(response => response.arrayBuffer())
      .then(notes => {
        let note = new TextDecoder("utf-8").decode(notes);
        this.setState({ note });
      });
    let cachedReleases = localStorage.getItem(this.releasesKey);
    if (cachedReleases) {
      let expiry = new Date(
        parseInt(localStorage.getItem(this.releasesKey + "Expires"), 10)
      ).getTime();
      if (new Date().getTime() < expiry) {
        console.log("using cached release information");
        return this.setFirmware(JSON.parse(cachedReleases));
      }
    }

    this.fetchReleases();
  }

  render() {
    return (
      <Paper
        style={{
          display: "flex",
          flexDirection: "column",
          position: "relative",
          flex: "1",
          padding: "30px 10px 10px 10px",
          minHeight: "100%",
          boxSizing: "border-box"
        }}
      >
        <div style={{ display: "flex" }}>
          <Typography paragraph variant="title">
            <FormattedMessage id="dfu.select.version" />
          </Typography>
          <div style={{ flexGrow: 1 }} />
          {this.props.goBack && (
            <Button color="primary" onClick={this.props.goBack}>
              <FormattedMessage id="common.go-back" />
            </Button>
          )}
        </div>
        <div style={{ display: "flex" }}>
          <HelperSelect
            style={{ flex: 1 }}
            label="dfu.target.title"
            value={this.state.currentTarget}
            disabled={
              this.state.isFlashing ||
              this.state.hasTarget ||
              !!this.state.selectedFile
            }
            onChange={event => {
              this.setState({ currentTarget: event.target.value });
            }}
            items={
              this.state.targetItems &&
              this.state.targetItems.map(target => {
                return {
                  value: target,
                  label: target || "Choose One..."
                };
              })
            }
          />
          {this.state.allowUpload && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0 8px 0 0"
              }}
            >
              <Typography>
                <FormattedMessage id="common.or" />
              </Typography>
            </div>
          )}
          {this.state.allowUpload && (
            <Input
              style={{ flex: 1, marginBottom: 8 }}
              type="file"
              name="fileUpload"
              inputProps={{
                accept: "bin"
              }}
              onChange={event => this.loadLocalFile(event)}
            />
          )}
        </div>
        {this.state.currentTarget && (
          <HelperSelect
            label="dfu.select.version"
            value={this.state.current}
            disabled={this.state.isFlashing || !!this.state.selectedFile}
            onChange={event => {
              this.setState({ current: event.target.value });
            }}
            items={
              this.state.items &&
              this.state.items.map(fw => {
                return {
                  value: fw.download_url || "",
                  label: fw.name || "Choose One..."
                };
              })
            }
          />
        )}
        <Button
          style={{ margin: "20px" }}
          color="primary"
          variant="contained"
          onClick={() => this.handleFlash()}
          disabled={
            this.state.isFlashing ||
            (!this.state.current && !this.state.selectedFile)
          }
        >
          <FormattedMessage id="common.flash" />
        </Button>
        <Paper
          theme={this.state.theme}
          elevation={3}
          style={{ margin: "10px", padding: "10px" }}
        >
          <Typography>
            <ReactMarkdown
              source={this.state.note}
              classNames={this.state.theme}
            />
          </Typography>
        </Paper>
        <CliView disabled={true} startText={this.cliNotice} ref="cliView" />
      </Paper>
    );
  }
}
