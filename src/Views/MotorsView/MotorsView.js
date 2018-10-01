import React, { Component } from "react";
import Button from "@material-ui/core/Button";
import ConfigListView from "../ConfigListView/ConfigListView";
import Paper from "@material-ui/core/Paper";
import theme from "../../Themes/Dark";
import MotorsSlidersView from "./MotorsSlidersView";

export default class MotorsView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showMotorSliders: false
    };
  }

  render() {
    return (
      <div>
        <Paper
          theme={theme}
          elevation={3}
          style={{ margin: "10px", padding: "10px" }}
        >
          <div style={{ display: "flex" }}>
            <Button
              onClick={() =>
                this.setState({
                  showMotorSliders: !this.state.showMotorSliders
                })
              }
              variant="raised"
              color="primary"
            >{`${
              this.state.showMotorSliders ? "Hide" : "Show"
            } Motor Sliders`}</Button>
            <div style={{ flexGrow: 1 }} />
          </div>
          {this.state.showMotorSliders && <MotorsSlidersView />}
        </Paper>
        <Paper
          theme={theme}
          elevation={3}
          style={{ margin: "10px", padding: "10px" }}
        >
          <ConfigListView
            notifyDirty={this.props.notifyDirty}
            items={this.props.items}
          />
        </Paper>
      </div>
    );
  }
}
