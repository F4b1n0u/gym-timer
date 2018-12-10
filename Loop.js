import React from 'react'
import { StyleSheet, Animated, Easing, Text, View} from 'react-native'
import memoize from 'fast-memoize'
import { Svg } from 'expo'

const AnimatedSvgPath = Animated.createAnimatedComponent(Svg.Path)

const ANIMATION_PRECISION = 4
const RESOLUTION = 10
class Loop extends React.Component {
  constructor(props) {
    super(props)

    const {
      width,
      borderWidth,
      headProgression,
      tailProgression,
      durations: {
        loopIn,
        loopOut,
      },
      easings: {
        in: easingIn,
        loopIn: easingLoopIn,
        loopOut: easingLoopOut,
        out: easingOut,
      },
    } = props

    this.state = {
      countdown: (loopIn + loopOut) / 1000,
    }

    const interpolations = {
      in: {
        inputRange:  [this._getStep(0), this._getStep(1)],
        outputRange: [0,                1/2],
        easing: easingIn,
        extrapolate: 'clamp',
        useNativeDriver: true,
      },
      loopIn: {
        inputRange:  [this._getStep(1), this._getStep(2)],
        outputRange: [Math.PI,    Math.PI * 2],
        easing: easingLoopIn,
        extrapolate: 'clamp',
        useNativeDriver: true,
      },
      loopOut: {
        inputRange:  [this._getStep(2), this._getStep(3)],
        outputRange: [0,          Math.PI],
        easing: easingLoopOut,
        extrapolate: 'clamp',
        useNativeDriver: true,
      },
      out: {
        inputRange:  [this._getStep(3), this._getStep(4)],
        outputRange: [0,                3/6 + width/2 + borderWidth ],
        easing: easingOut,
        extrapolate: 'clamp',
        useNativeDriver: true,
      },
    }

    this.headIn = headProgression.interpolate(interpolations.in)
    this.headLoopIn = headProgression.interpolate(interpolations.loopIn)
    this.headLoopOut = headProgression.interpolate(interpolations.loopOut)
    this.headOut = headProgression.interpolate(interpolations.out)

    this.tailIn = tailProgression.interpolate(interpolations.in)
    this.tailLoopIn = tailProgression.interpolate(interpolations.loopIn)
    this.tailLoopOut = tailProgression.interpolate(interpolations.loopOut)
    this.tailOut = tailProgression.interpolate(interpolations.out)

    headProgression.addListener(this._setPaths)
    tailProgression.addListener(this._setPaths)
    tailProgression.addListener(this._handleTailMoveForCountDown)
  }

  componentWillMount() {
    const {
      headProgression,
      tailProgression,
    } = this.props
    
    headProgression.removeListener(this._setPaths)
    tailProgression.removeListener(this._setPaths)
    tailProgression.removeListener(this._handleTailMoveForCountDown)
  }

  componentDidMount() {
    this._setPaths('whatever', true)
  }

  render() {
    const {
      fillColor,
      borderColor,
      borderWidth,
      trailColor,
    } = this.props

    const {
      countdown,
    } = this.state

    const d = 'M 0 0'
    
    return (
      <View
        style={styles.timer}
      >
        <Svg
          style={styles.loop}
          viewBox={`0 0 ${RESOLUTION} ${RESOLUTION}`}
        >
          {trailColor && (
            <React.Fragment>
              <Svg.Path
                d={this._getWholeInPath(0, 0.5, Math.PI, 2 * Math.PI)}
                fill={trailColor}
              />
              <Svg.Path
                d={this._getWholeOutPath(0, Math.PI, 0, 1/2)}
                fill={trailColor}
              />
            </React.Fragment>
          )}
          
          <AnimatedSvgPath
            ref={ ref => this._loopOutElement = ref }
            d={d}
            stroke={borderColor}
            fill={fillColor}
            strokeWidth={borderWidth}
          />

          <AnimatedSvgPath
            ref={ ref => this._loopInElement = ref }
            d={d}
            stroke={borderColor}
            fill={fillColor}
            strokeWidth={borderWidth}
          />
        </Svg>

        <Text
          style={styles.countdown}
        >
          {countdown}
        </Text>
      </View>

    )
  }

  _getStep = memoize((ratio) => {
    const {
      startsAt,
      endsAt,
    } = this.props

    return startsAt + ratio / 4 * Math.abs(endsAt - startsAt)
  })

  _setPaths = (value, force = false) => {
    let {
      headProgression,
      tailProgression,
      startsAt,
      endsAt,
    } = this.props

    
    headProgression = headProgression.__getValue()
    tailProgression = tailProgression.__getValue()

    if (
      !force &&
      (tailProgression < startsAt || tailProgression > endsAt) &&
      (headProgression < startsAt || headProgression > endsAt)
    ) {
      return
    }

    if(headProgression <= this._getStep(2) || tailProgression <= this._getStep(2)) {
      const headIn = Number(this.headIn.__getValue().toFixed(ANIMATION_PRECISION))
      const headLoopIn = Number(this.headLoopIn.__getValue().toFixed(ANIMATION_PRECISION))
      const tailLoopIn = Number(this.tailLoopIn.__getValue().toFixed(ANIMATION_PRECISION))
      const tailIn = Number(this.tailIn.__getValue().toFixed(ANIMATION_PRECISION))
      const wholeIntPath = this._getWholeInPath(tailIn, headIn, tailLoopIn, headLoopIn)

      this._loopInElement && this._loopInElement.setNativeProps({ d: wholeIntPath});
    } else {
      this._loopInElement && this._loopInElement.setNativeProps({ d: 'M 0 0' });
    }
    
    if(headProgression >= this._getStep(2) || tailProgression >= this._getStep(2)) {
      const headLoopOut = Number(this.headLoopOut.__getValue().toFixed(ANIMATION_PRECISION))
      const headOut = Number(this.headOut.__getValue().toFixed(ANIMATION_PRECISION))
      const tailLoopOut = Number(this.tailLoopOut.__getValue().toFixed(ANIMATION_PRECISION))
      const tailOut = Number(this.tailOut.__getValue().toFixed(ANIMATION_PRECISION))
      const wholeOutPath = this._getWholeOutPath(tailLoopOut, headLoopOut, tailOut, headOut)

      this._loopOutElement && this._loopOutElement.setNativeProps({ d: wholeOutPath});
    } else {
      this._loopOutElement && this._loopOutElement.setNativeProps({ d: 'M 0 0'});
    }
  }
 
  _getWholeInPath = memoize((tailIn, headIn, tailLoop, headLoop) => {
    const {
      width,
      xStartPosition,
      loopRadius,
    } = this.props

    const halfWidth = width / 2
    const cosHeadLoop = Math.cos(headLoop)
    const sinHeadLoop = Math.sin(headLoop)
    const cosTailLoop = Math.cos(tailLoop)
    const sinTailLoop = Math.sin(tailLoop)
    const cosTailLoopPlusPI = Math.cos(tailLoop + Math.PI)
    const sinTailLoopPlusPI = Math.sin(tailLoop + Math.PI)
    const innerRadius = loopRadius - halfWidth
    const outterRadius = loopRadius + halfWidth
    const capRadius = halfWidth / 6


    const headloopInt = {
      x: xStartPosition + halfWidth + (cosHeadLoop + 1) * innerRadius,
      y: headIn - sinHeadLoop * innerRadius,
    }
    const tailLoopInt = {
      x: xStartPosition + halfWidth + ((cosTailLoop + 1) * innerRadius),
      y: headIn - (1 * sinTailLoop) * innerRadius,
    }
    const tailInInt = {
      dx: 0,
      dy: -1/2 + tailIn,
    }
    const tailInExt = {
      dx: 0,
      dy: 1/2 - tailIn,
    }

    const tailLoopExt = {
      dx: -cosTailLoopPlusPI * width,
      dy: sinTailLoopPlusPI * width
    }
    const headloopExt = {
      x: xStartPosition - halfWidth + ((cosHeadLoop + 1) * outterRadius),
      y: headIn - sinHeadLoop * outterRadius,
    }
    
    const path = `
      M
      ${headloopInt.x * RESOLUTION}
      ${headloopInt.y * RESOLUTION}
      
      A
      ${(loopRadius - halfWidth) * RESOLUTION}
      ${(loopRadius - halfWidth) * RESOLUTION}
      0 0 1
      ${tailLoopInt.x * RESOLUTION}
      ${tailLoopInt.y * RESOLUTION}

      l
      ${tailInInt.dx * RESOLUTION}
      ${tailInInt.dy * RESOLUTION}

      a
      ${capRadius * RESOLUTION}
      ${capRadius * RESOLUTION}
      0 0 0
      ${tailLoopExt.dx * RESOLUTION}
      ${tailLoopExt.dy * RESOLUTION}

      l
      ${tailInExt.dx * RESOLUTION}
      ${tailInExt.dy * RESOLUTION}

      A
      ${(loopRadius + halfWidth) * RESOLUTION}
      ${(loopRadius + halfWidth) * RESOLUTION}
      0 0 0
      ${headloopExt.x * RESOLUTION}
      ${headloopExt.y * RESOLUTION}
    `

    const cap = headLoop < 2 * Math.PI ? `
      A
      ${capRadius * RESOLUTION}
      ${capRadius * RESOLUTION}
      0 0 0
      ${headloopInt.x * RESOLUTION}
      ${headloopInt.y * RESOLUTION}
    ` : ''

    return `
      ${path}
      ${cap}
    `
  })

  _getWholeOutPath = memoize((tailLoop, headLoop, tailOut, headOut) => {
    const {
      width,
      xStartPosition,
      loopRadius,
    } = this.props
    
    center = {
      x: xStartPosition + loopRadius,
      y: 1/2,
    }

    const halfWidth = width / 2
    const cosHeadLoop = Math.cos(headLoop)
    const sinHeadLoop = Math.sin(headLoop)
    const cosTailLoop = Math.cos(tailLoop)
    const sinTailLoop = Math.sin(tailLoop)
    const cosHeadLoopPlusPI = Math.cos(headLoop + Math.PI)
    const sinHeadLoopPlusPI = Math.sin(headLoop + Math.PI)
    const innerRadius = loopRadius - halfWidth
    const outterRadius = loopRadius + halfWidth
    const capRadius = halfWidth / 6

    const tailLoopExt = { // OK
      x: center.x + cosTailLoop * outterRadius,
      y: center.y + -1 * sinTailLoop * outterRadius + tailOut,
    }
    const headLoopExt = {
      x: center.x + cosHeadLoop * outterRadius,
      y: center.y + -1 * sinHeadLoop * outterRadius + tailOut,
    }
    const headOutExt = {
      x: headLoopExt.x,
      y: headLoopExt.y + headOut,
    }
    const headOutInt = {
      dx: cosHeadLoopPlusPI * width,
      dy: -sinHeadLoopPlusPI * width,
    }
    const headLoopInt = {
      x: center.x + cosHeadLoop * innerRadius,
      y: center.y - sinHeadLoop * innerRadius + tailOut,
    }
    const tailLoopInt = {
      x: center.x + cosTailLoop * innerRadius,
      y: center.y - sinTailLoop * innerRadius + tailOut,
    }

    const path = `
      M
      ${tailLoopExt.x * RESOLUTION}
      ${tailLoopExt.y * RESOLUTION}

      A
      ${(loopRadius + halfWidth) * RESOLUTION}
      ${(loopRadius + halfWidth) * RESOLUTION}
      0 0 0
      ${headLoopExt.x * RESOLUTION}
      ${headLoopExt.y * RESOLUTION}

      L
      ${headOutExt.x * RESOLUTION}
      ${headOutExt.y * RESOLUTION}

      a
      ${capRadius * RESOLUTION}
      ${capRadius * RESOLUTION}
      0 0 0
      ${headOutInt.dx * RESOLUTION}
      ${headOutInt.dy * RESOLUTION}

      L
      ${headLoopInt.x * RESOLUTION}
      ${headLoopInt.y * RESOLUTION}

      A
      ${innerRadius * RESOLUTION}
      ${innerRadius * RESOLUTION}
      0 0 1
      ${tailLoopInt.x * RESOLUTION}
      ${tailLoopInt.y * RESOLUTION}

      A
      ${capRadius * RESOLUTION}
      ${capRadius * RESOLUTION}
      0 0 0
      ${tailLoopExt.x * RESOLUTION}
      ${tailLoopExt.y * RESOLUTION}
    `

    return path
  })

  _handleTailMoveForCountDown = ({ value }) => {
    this._setCountdown(Number(value.toFixed(ANIMATION_PRECISION)))
  }

  _setCountdown = memoize((tailProgression) => {
    const {
      durations: {
        loopIn: loopInDuration,
        loopOut: loopOutDuration,
      },
      startsAt,
    } = this.props

    const {
      countdown,
    } = this.state

    const relativeTailProgression = tailProgression - startsAt

    const duration = loopInDuration + loopOutDuration + 1000
    let relativeProgression
    let secondRate

    if (relativeTailProgression > .25 && relativeTailProgression < .5) { // in the in loop
      relativeProgression = (relativeTailProgression - .25) * 4  // (0 -> 1)
      secondRate = loopInDuration * relativeProgression          // (0 -> loopInDuration)

      const newCountdown = Math.floor((duration - secondRate) / 1000)

      if (countdown !== newCountdown) {
        this.setState({
          countdown: newCountdown
        })
      }
    } else if (relativeTailProgression > .5 && relativeTailProgression < .75) { // in the out loop
      const relativeProgression = (relativeTailProgression - .5) * 4  // (0 -> 1)
      secondRate = loopOutDuration * relativeProgression            // (0 -> loopInDuration)

      const newCountdown = Math.floor((duration - loopInDuration - secondRate) / 1000)

      if (countdown !== newCountdown) {
        this.setState({
          countdown: newCountdown
        })
      }
    } else if (relativeTailProgression > .75 && countdown !== 0) {
      this.setState({
        countdown: 0
      })
    }
  })
}

const styles = StyleSheet.create({
  timer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loop: {
    width: '100%',
    aspectRatio: 1,
  },
  countdown: {
    color: '#fff',
    position: 'absolute',
    fontSize: 140,
    textAlign: 'center',
    width: '100%',
  }
})

export default Loop
