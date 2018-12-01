import React from 'react'
import { StyleSheet, SafeAreaView, Animated, Easing } from 'react-native'
import memoize from 'fast-memoize'
import { Svg } from 'expo'
import Color from 'color'

const AnimatedSvgPath = Animated.createAnimatedComponent(Svg.Path)

const TIMER_WIDTH = 1 / 10
const TIMER_WIDTH_DELTA = TIMER_WIDTH / 2
const TIMER_RADIUS = 3 / 10
const TIMER_START_POSITION = 2 / 10
const TIMER_BORDER_WIDTH = .5 / 100

// #5A7AED
// #DEA950
// #212121
const TIMER_COLOR = Color('#DEA950') 
const TIMER_TRAIL_COLOR = TIMER_COLOR.lightness(8)

class Timer extends React.Component {
  constructor(props) {
    super(props)

    const {
      progression,
      startAt,
      stopAt,
    } = props

    // for the join animation
    const retardedStartat = startAt - (1/33)

    const getStep = (ratio) => {
      return startAt + Math.abs(stopAt - startAt) * ratio
    }

    this.tailPositionDelta = progression.interpolate({
      inputRange:  [retardedStartat, getStep(1/6) , stopAt],
      outputRange: [-TIMER_WIDTH/2, 3/6, 3/6],
      extrapolate: 'clamp',
    })
    this.firstArcRotationProgression = progression.interpolate({
      inputRange:  [retardedStartat, getStep(1/6), getStep(2/6),    getStep(3/6), getStep(4/6), getStep(5/6), stopAt],
      outputRange: [Math.PI, Math.PI,      Math.PI * 3 / 2, Math.PI * 2,  Math.PI * 2,  Math.PI * 2,  Math.PI * 2],
      extrapolate: 'clamp',
    })

    this.secondArcRotationProgression = progression.interpolate({
      inputRange:  [retardedStartat, getStep(1/6),  getStep(2/6), getStep(3/6), getStep(4/6),    getStep(5/6), stopAt],
      outputRange: [0,       0,             0,            0,            Math.PI * 1 / 2, Math.PI,      Math.PI],
      extrapolate: 'clamp',
    })
    this.headPositionDelta = progression.interpolate({
      inputRange:  [retardedStartat, getStep(5/6), stopAt],
      outputRange: [0,       0/6,          3/6 + TIMER_WIDTH/2 ],
      extraPolate: 'clamp',
    })

    progression.addListener(this._setArcsSvgPathD)
  }
  
  componentDidMount() {
    this._setArcsSvgPathD({ value: this.props.progression._value })
  }

  componentWillMount() {
    this.props.progression.removeListener(this._setFirstArcSvgPathD);
  }

  render() {
    const d = ''

    return (
      <Svg
        style={styles.timer}
        viewBox={`0 0 1 1`}
      >
        <AnimatedSvgPath
          d={this._getFirstArcSvgPathD(3/6, Math.PI * 2)}
          fill={TIMER_TRAIL_COLOR.hex()}
          strokeWidth={TIMER_BORDER_WIDTH}
        />
        <AnimatedSvgPath
          d={this._getSecondArcSvgPathD(Math.PI, 3/6)}
          fill={TIMER_TRAIL_COLOR.hex()}
          strokeWidth={TIMER_BORDER_WIDTH}
        />

        <AnimatedSvgPath
          ref={ ref => this._firstArcSvgPath = ref }
          d={d}
          stroke="black"
          fill={TIMER_COLOR.hex()}
          strokeWidth={TIMER_BORDER_WIDTH}
        />
        
        <AnimatedSvgPath
          ref={ ref => this._secondArcSvgPath = ref }
          d={d}
          stroke="black"
          fill={TIMER_COLOR.hex()}
          strokeWidth={TIMER_BORDER_WIDTH}
        />
      </Svg>
    )
  }

  _setArcsSvgPathD = memoize((progression) => {
    const tailPositionDeltaValue = this.tailPositionDelta.__getValue()
    const firstArcRotationProgressionValue = this.firstArcRotationProgression.__getValue()

    const secondArcRotationProgression = this.secondArcRotationProgression.__getValue()
    const headPositionDelta = this.headPositionDelta.__getValue()

    const firstArcSvgPathD= this._getFirstArcSvgPathD(tailPositionDeltaValue, firstArcRotationProgressionValue)
    const secondArcSvgPathD= this._getSecondArcSvgPathD(secondArcRotationProgression, headPositionDelta)

    this._firstArcSvgPath && this._firstArcSvgPath.setNativeProps({ d: firstArcSvgPathD});
    
    if(progression.value > this.props.startAt + Math.abs(this.props.stopAt - this.props.startAt)/2) {
      this._secondArcSvgPath && this._secondArcSvgPath.setNativeProps({ d: secondArcSvgPathD});
    } else {
      this._secondArcSvgPath && this._secondArcSvgPath.setNativeProps({ d: ''});
    }
  })
 
  _getFirstArcSvgPathD = memoize((tailPositionDeltaValue, firstArcRotationProgressionValue) => {
    return `
      M
      ${TIMER_START_POSITION - TIMER_WIDTH_DELTA}
      ${0}

      l
      ${0}
      ${tailPositionDeltaValue}
      
      a
      ${TIMER_RADIUS + TIMER_WIDTH_DELTA}
      ${TIMER_RADIUS + TIMER_WIDTH_DELTA}
      0 0 0
      ${(+1 * Math.cos(firstArcRotationProgressionValue) + 1) * (TIMER_RADIUS + TIMER_WIDTH_DELTA)}
      ${(-1 * Math.sin(firstArcRotationProgressionValue)) * (TIMER_RADIUS + TIMER_WIDTH_DELTA)}
      
      a
      ${TIMER_WIDTH_DELTA / 6}
      ${TIMER_WIDTH_DELTA / 6}
      0 0 0
      ${(+1 * Math.cos(firstArcRotationProgressionValue + Math.PI)) * (TIMER_WIDTH)}
      ${(-1 * Math.sin(firstArcRotationProgressionValue + Math.PI)) * (TIMER_WIDTH)}

      A
      ${TIMER_RADIUS - TIMER_WIDTH_DELTA}
      ${TIMER_RADIUS - TIMER_WIDTH_DELTA}
      0 0 1
      ${TIMER_START_POSITION + TIMER_WIDTH_DELTA}
      ${tailPositionDeltaValue}

      L
      ${TIMER_START_POSITION + TIMER_WIDTH_DELTA}
      ${0}

      a
      ${TIMER_WIDTH_DELTA / 6}
      ${TIMER_WIDTH_DELTA / 6}
      0 0 0
      ${- 2 * TIMER_WIDTH_DELTA}
      ${0}
      Z
    `
  })

  _getSecondArcSvgPathD = memoize((secondArcRotationProgressionValue, headPositionDeltaValue) => {
    return `
      M
      ${TIMER_START_POSITION + TIMER_WIDTH_DELTA + 2 * TIMER_RADIUS}
      ${1/2}

      a
      ${TIMER_RADIUS + TIMER_WIDTH_DELTA}
      ${TIMER_RADIUS + TIMER_WIDTH_DELTA}
      0 0 0
      ${(1 * Math.cos(secondArcRotationProgressionValue) - 1) * (TIMER_RADIUS + TIMER_WIDTH_DELTA)}
      ${(-1 * Math.sin(secondArcRotationProgressionValue)) * (TIMER_RADIUS + TIMER_WIDTH_DELTA)}

      l
      ${0}
      ${headPositionDeltaValue}

      a
      ${TIMER_WIDTH_DELTA / 6}
      ${TIMER_WIDTH_DELTA / 6}
      0 0 0
      ${(+1 * Math.cos(secondArcRotationProgressionValue + Math.PI)) * (TIMER_WIDTH)}
      ${(-1 * Math.sin(secondArcRotationProgressionValue + Math.PI)) * (TIMER_WIDTH)}

      l
      ${0}
      ${-headPositionDeltaValue}

      A
      ${TIMER_RADIUS - TIMER_WIDTH_DELTA}
      ${TIMER_RADIUS - TIMER_WIDTH_DELTA}
      0 0 1
      ${TIMER_START_POSITION - TIMER_WIDTH_DELTA + 2 * TIMER_RADIUS}
      ${1/2}
    `
  })
}

const styles = StyleSheet.create({
  timer: {
    width: '100%',
    aspectRatio: 1,
    // borderWidth: 1,
    // borderColor: "grey",
  }
})

export default Timer
