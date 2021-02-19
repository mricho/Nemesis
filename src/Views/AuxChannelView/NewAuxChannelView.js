import React, { useState, useEffect } from "react";
import List from "@material-ui/core/List";
import AuxChannelItemView from "./AuxChannelItemView";
import Paper from "@material-ui/core/Paper";
import FCConnector from "../../utilities/FCConnector";
import { FormattedMessage } from "react-intl";
import Typography from "@material-ui/core/Typography";

//==============
import { makeStyles } from "@material-ui/core/styles";
import Accordion from "@material-ui/core/Accordion"; // move this to component
import AccordionDetails from "@material-ui/core/AccordionDetails";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionActions from "@material-ui/core/AccordionActions";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Chip from "@material-ui/core/Chip";
import Divider from "@material-ui/core/Divider";
import Button from "@material-ui/core/Button";
import clsx from "clsx";
const useStyles = makeStyles(theme => ({
  root: {
    width: "100%"
  },
  heading: {
    fontSize: theme.typography.pxToRem(15)
  },
  secondaryHeading: {
    fontSize: theme.typography.pxToRem(15),
    color: theme.palette.text.secondary
  },
  icon: {
    verticalAlign: "bottom",
    height: 20,
    width: 20
  },
  details: {
    alignItems: "center"
  },
  column: {
    flexBasis: "33.33%"
  },
  helper: {
    borderLeft: `2px solid ${theme.palette.divider}`,
    padding: theme.spacing(1, 2)
  },
  link: {
    color: theme.palette.primary.main,
    textDecoration: "none",
    "&:hover": {
      textDecoration: "underline"
    }
  }
}));

//==============

// <AuxChannelView
// fcConfig={mergedProfile}
// auxScale={mergedProfile.rx_scale}
// auxModeList={mergedProfile.aux_channel_modes}
// modes={mergedProfile.modes && mergedProfile.modes.values}
// notifyDirty={(isDirty, item, newValue) =>
//   this.notifyDirty(isDirty, item, newValue)
// }
// />

export default function NewAuxChannelView(props) {
  /*
  constructor(props) {
    super(props);
    //this.state = {
    //  channels: []
    //};
    
  };
  */

  //state
  const [channels, setChannels] = useState([]);
  const [modes, setModes] = useState([]);
  const [modeMappings, setModeMappings] = useState([]);

  const classes = useStyles(); // move to component
  const handleRXData = message => {
    try {
      let { rx } = JSON.parse(message.data);
      if (rx) {
        setChannels(rx.channels);
      }
    } catch (ex) {
      console.warn("unable to parse telemetry", ex);
    }
  };

  //TODO: rename processedModes to something else.
  //function to create map of each mode, and its config
  const mapModes = (auxModeList, modes) => {
    let mappedAuxModes = auxModeList;

    for (var i = 0; i < modes.length; i++) {
      let mode = modes[i];
      let auxModeID = mode["auxId"] + 1;
      //TODO support multiple mappings?
      mappedAuxModes[auxModeID]["mappings"] = {
        id: mode["id"],
        channel: mode["channel"],
        range: mode["range"]
      };
    }

    setModeMappings(mappedAuxModes);
  };

  useEffect(() => {
    // code to run on component mount
    if (!modes) {
      FCConnector.getModes().then(modes => {
        setModes(modes);
      });
    }
    mapModes(props.auxModeList, modes);
    FCConnector.webSockets.addEventListener("message", handleRXData);
    //temp disabled for debugging - allows modes in react view to not refresh constantly
    //FCConnector.startTelemetry("rx");
    return function cleanup() {
      FCConnector.webSockets.removeEventListener("message", handleRXData);
      FCConnector.stopFastTelemetry();
    };
  }, []);

  return (
    <Paper>
      <List>
        {modeMappings &&
          modeMappings.slice(1).map((auxMode, i) => {
            return (
              <Accordion>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="panel1c-content"
                  id="panel1c-header"
                >
                  <div className={classes.column}>
                    <Typography className={classes.heading}>
                      <FormattedMessage id={auxMode.label} />
                    </Typography>
                  </div>
                  <div className={classes.column}>
                    <Typography className={classes.secondaryHeading}>
                      <FormattedMessage id="aux.select.channel" />
                    </Typography>
                  </div>
                </AccordionSummary>
                <AccordionDetails className={classes.details}>
                  <div className={classes.column} />
                  <div className={classes.column}>
                    <Chip label="{mode.channel}" onDelete={() => {}} />
                  </div>
                  <div className={clsx(classes.column, classes.helper)}>
                    <Typography variant="caption">
                      Explanation of flight mode
                      <br />
                      <a
                        href="#secondary-heading-and-columns"
                        className={classes.link}
                      >
                        Learn more
                      </a>
                    </Typography>
                  </div>
                </AccordionDetails>
                <Divider />
                <AccordionActions>
                  <Button size="small">Cancel</Button>
                  <Button size="small" color="primary">
                    Save
                  </Button>
                </AccordionActions>
              </Accordion>
            );
          })}
      </List>
    </Paper>
  );
}
