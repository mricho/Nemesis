import React, { Component } from "react";
import FCConnector from "../../utilities/FCConnector";
import ConfigListView from "../ConfigListView/ConfigListView";
import Paper from "@material-ui/core/Paper";
import LinearProgress from "@material-ui/core/LinearProgress";
import Typography from "@material-ui/core/Typography";
import { Button } from "@material-ui/core";
import { FormattedMessage } from "react-intl";
import "./BlackboxView.css";

export default class BlackBoxView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      theme: props.theme,
      storageInfo: {
        totalSize: 1,
        usedSize: 0
      }
    };
  }
  componentDidMount() {
    return FCConnector.storage().then(storageInfo => {
      this.setState({ storageInfo });
    });
  }
  render() {
    let normalizedPercent =
      ((this.state.storageInfo.usedSize - 0) * 100) /
      (this.state.storageInfo.totalSize - 0);
    return (
      <div>
        <Paper>
          <div style={{ position: "relative" }}>
            <Typography variant="caption" className="absolute-center-text">
              {this.state.storageInfo.usedSize}/
              {this.state.storageInfo.totalSize}
            </Typography>
            <Typography variant="caption">
              <FormattedMessage
                id="blackbox.flash-used"
                values={{ percent: normalizedPercent.toFixed(2) }}
              />
            </Typography>
            <LinearProgress
              variant="determinate"
              style={{ height: 20, margin: 10 }}
              value={normalizedPercent}
            />
            <br />
            <Button
              onClick={() => FCConnector.sendCommand("msc")}
              variant="contained"
              color="primary"
            >
              <FormattedMessage id="blackbox.load-drive" />
            </Button>
            <Button
              onClick={() => FCConnector.storage("erase")}
              variant="contained"
              color="secondary"
              style={{ marginLeft: 20 }}
            >
              <FormattedMessage id="blackbox.erase-storage" />
            </Button>
          </div>
        </Paper>
        <Paper>
          <ConfigListView
            fcConfig={this.props.fcConfig}
            notifyDirty={this.props.notifyDirty}
            items={this.props.items}
          />
        </Paper>
      </div>
    );
  }
}
