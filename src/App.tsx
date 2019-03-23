import * as React from 'react';
import './App.css';

interface IDevice {
  id: string;
  label: string;
}
interface IState {
  devices: IDevice[];
  deviceId?: string;
  keypoints?: IKeypoint[];
  size: {
    x: number;
    y: number;
  };
}
interface IKeypoint {
  part: string;
  position: {
    x: number;
    y: number;
  };
  score: number;
}

class App extends React.Component<{}, IState> {
  public stream: MediaStream;
  public videoRef: React.RefObject<any>;

  public state: Readonly<IState> = {
    devices: [],
    keypoints: [],
    size: {
      x: 800,
      y: 800
    }
  };

  constructor(props: any) {
    super(props);
    this.videoRef = React.createRef();
  }

  public updateDimensions = () => {
    // indeed this part isnt mine, lets not re-invent the wheel :)
    const body = document.documentElement.getElementsByTagName('body')[0];
    const x =
      window.innerWidth ||
      document.documentElement.clientWidth ||
      body.clientWidth;
    const y =
      window.innerHeight ||
      document.documentElement.clientHeight ||
      body.clientHeight;

    const min = x > y ? y : x;
    console.log(min);
    this.setState({
      size: {
        x: min,
        y: min
      }
    });
  };

  public componentDidMount() {
    window.addEventListener('resize', this.updateDimensions);
    this.updateDimensions();
    // Set available devices to state
    navigator.mediaDevices.enumerateDevices().then(devices => {
      this.setState({
        devices: devices
          .filter(device => device.kind === 'videoinput')
          .map((device, idx) => {
            return {
              id: device.deviceId,
              label: device.label || `Cam ${idx}`
            };
          })
      });
    });

    // could not get it to work with npm, there is an error in the package
    // even before doing something with it, so ive just imported the cdn hosted
    // ones
    setTimeout(() => {
      (window as any).posenet.load(1.01).then((net: any) => {
        setInterval(() => {
          net
            .estimateSinglePose(this.videoRef.current, 0.5, false, 16)
            .then((pose: any) => {
              this.setKeypoints(pose.keypoints);
            });
        }, 50);
      });
    }, 2500);

    this.startCam();
  }

  public setKeypoints(keypoints: IKeypoint[]) {
    this.setState({
      keypoints: keypoints.filter((keypoint: IKeypoint) => {
        return ['nose', 'rightEye', 'leftEye'].includes(keypoint.part);
      })
    });
  }

  public startCam() {
    // stop tracks if any
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
    }

    const deviceId = this.state.deviceId;
    const constraints = deviceId
      ? {
          audio: false,
          video: {
            deviceId: {
              exact: deviceId
            }
          }
        }
      : {
          audio: false,
          video: true
        };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(stream => {
        this.stream = stream;
        this.videoRef.current.srcObject = stream;
      })
      .catch(error => console.error(error));
  }

  public changeCam = (e: any) => {
    this.setState({ deviceId: e.target.value });
    this.startCam();
  };

  public render() {
    return (
      <div className="App">
        <video
          ref={this.videoRef}
          controls={false}
          autoPlay={true}
          playsInline={true}
          height={`${this.state.size.y}px`}
          width={`${this.state.size.x}px`}
        />
        <select onChange={this.changeCam} value={this.state.deviceId}>
          {this.state.devices.map(device => {
            return (
              <option key={device.id} value={device.id}>
                {device.label}
              </option>
            );
          })}
        </select>
        {this.state.keypoints &&
          this.state.keypoints.map(keypoint => {
            return (
              <div
                key={keypoint.part}
                className={`emoji ${keypoint.part}`}
                style={{
                  left: keypoint.position.x,
                  top: keypoint.position.y
                }}
              />
            );
          })}
      </div>
    );
  }
}

export default App;
