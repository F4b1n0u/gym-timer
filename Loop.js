import React from 'react'
import { StyleSheet, Animated, Easing, Text, View } from 'react-native'
import memoize from 'fast-memoize'
import { Svg } from 'expo'

const AnimatedSvgPath = Animated.createAnimatedComponent(Svg.Path)

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
        extrapolate: 'clamp',
        easing: easingIn,
      },
      loopIn: {
        inputRange:  [this._getStep(1), this._getStep(2)],
        outputRange: [Math.PI,    Math.PI * 2],
        extrapolate: 'clamp',
        easing: easingLoopIn,
      },
      loopOut: {
        inputRange:  [this._getStep(2), this._getStep(3)],
        outputRange: [0,          Math.PI],
        extrapolate: 'clamp',
        easing: easingLoopOut,
      },
      out: {
        inputRange:  [this._getStep(3), this._getStep(4)],
        outputRange: [0,                3/6 + width/2 + borderWidth ],
        extrapolate: 'clamp',
        easing: easingOut,
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
    tailProgression.addListener(this._setCountdown)
  }

  componentWillMount() {
    const {
      headProgression,
      tailProgression,
    } = this.props
    
    headProgression.removeListener(this._setPaths);
    tailProgression.removeListener(this._setPaths);
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
          viewBox={`0 0 1 1`}
        >
          {trailColor && (
            <React.Fragment>
              <Svg.Path
                d={this._getWholeInPath(0, 0.5, Math.PI, 2 * Math.PI)}
                fill={trailColor}
                strokeWidth={borderWidth}
                stroke={borderColor}
              />
              <Svg.Path
                d={this._getWholeOutPath(0, Math.PI, 0, 1/2)}
                fill={trailColor}
                strokeWidth={borderWidth}
                stroke={borderColor}
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

  _getStep = (ratio) => {
    const {
      startsAt,
      endsAt,
    } = this.props

    return startsAt + ratio / 4 * Math.abs(endsAt - startsAt)
  }

  _setPaths = (value, force=false) => {
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

    const headIn = this.headIn.__getValue()
    const headLoopIn = this.headLoopIn.__getValue()
    const headLoopOut = this.headLoopOut.__getValue()
    const headOut = this.headOut.__getValue()

    const tailIn = this.tailIn.__getValue()
    const tailLoopIn = this.tailLoopIn.__getValue()
    const tailLoopOut = this.tailLoopOut.__getValue()
    const tailOut = this.tailOut.__getValue()

    const wholeIntPath = this._getWholeInPath(tailIn, headIn, tailLoopIn, headLoopIn)
    const wholeOutPath = this._getWholeOutPath(tailLoopOut, headLoopOut, tailOut, headOut)

    if(headProgression <= this._getStep(2) || tailProgression <= this._getStep(2)) {
      this._loopInElement && this._loopInElement.setNativeProps({ d: wholeIntPath});
    } else {
      this._loopInElement && this._loopInElement.setNativeProps({ d: 'M 0 0' });
    }
    
    if(headProgression >= this._getStep(2) || tailProgression >= this._getStep(2)) {
      this._loopOutElement && this._loopOutElement.setNativeProps({ d: wholeOutPath});
    } else {
      this._loopOutElement && this._loopOutElement.setNativeProps({ d: 'M 0 0'});
    }
  }
 
  _setCountdown = ({ value: tailProgression }) => {
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

    if (relativeTailProgression > .25 && relativeTailProgression < .5) {
      const relativeProgression = (relativeTailProgression - .25) * 4  // (0 -> 1)
      secondRate = loopInDuration * relativeProgression                // (0 -> loopInDuration)

      this.setState({
        countdown: Math.floor((duration - secondRate) / 1000)
      })
    } else if (relativeTailProgression > .5 && relativeTailProgression < .75) {
      const relativeProgression = (relativeTailProgression - .5) * 4  // (0 -> 1)
      secondRate = loopOutDuration * relativeProgression                  // (0 -> loopInDuration)

      this.setState({
        countdown: Math.floor((duration - loopInDuration - secondRate) / 1000)
      })
    } else if (relativeTailProgression > .75 && countdown !== 0) {
      this.setState({
        countdown: 0
      })
    }
  }

  _getWholeInPath = memoize((tailIn, headIn, tailLoop, headLoop) => {
    const {
      width,
      xStartPosition,
      loopRadius,
    } = this.props

    const headloopInt = {
      x: xStartPosition + (width / 2) + (Math.cos(headLoop) + 1) * (loopRadius - (width / 2)),
      y: headIn - (1 * Math.sin(headLoop)) * (loopRadius - (width / 2)),
    }
    const tailLoopInt = {
      x: xStartPosition + (width / 2) + ((Math.cos(tailLoop) + 1) * (loopRadius - (width / 2))),
      y: headIn - (1 * Math.sin(tailLoop)) * (loopRadius - (width / 2)),
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
      dx: (-1 * Math.cos(tailLoop + Math.PI)) * (width),
      dy: (+1 * Math.sin(tailLoop + Math.PI)) * (width)
    }
    const headloopExt = {
      x: xStartPosition - (width / 2) + ((Math.cos(headLoop) + 1) * (loopRadius + (width / 2))),
      y: headIn - (1 * Math.sin(headLoop)) * (loopRadius + (width / 2)),
    }
    
    const path = `
      M
      ${headloopInt.x}
      ${headloopInt.y}
      
      A
      ${loopRadius - (width / 2)}
      ${loopRadius - (width / 2)}
      0 0 1
      ${tailLoopInt.x}
      ${tailLoopInt.y}

      l
      ${tailInInt.dx}
      ${tailInInt.dy}

      a
      ${(width / 2) / 6}
      ${(width / 2) / 6}
      0 0 0
      ${tailLoopExt.dx}
      ${tailLoopExt.dy}

      l
      ${tailInExt.dx}
      ${tailInExt.dy}

      A
      ${loopRadius + (width / 2)}
      ${loopRadius + (width / 2)}
      0 0 0
      ${headloopExt.x}
      ${headloopExt.y}
    `

    const cap = headLoop < 2 * Math.PI ? `
      A
      ${(width / 2) / 6}
      ${(width / 2) / 6}
      0 0 0
      ${headloopInt.x}
      ${headloopInt.y}
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

    const tailLoopExt = { // OK
      x: center.x + Math.cos(tailLoop) * (loopRadius + (width / 2)),
      y: center.y + -1 * Math.sin(tailLoop) * (loopRadius + (width / 2)) + tailOut,
    }
    const headLoopExt = {
      x: center.x + Math.cos(headLoop) * (loopRadius + (width / 2)),
      y: center.y + -1 * Math.sin(headLoop) * (loopRadius + (width / 2)) + tailOut,
    }
    const headOutExt = {
      x: headLoopExt.x,
      y: headLoopExt.y + headOut,
    }
    const headOutInt = {
      dx:  1 * Math.cos(headLoop + Math.PI) * (width),
      dy: -1 * Math.sin(headLoop + Math.PI) * (width),
    }
    const headLoopInt = {
      x: center.x + Math.cos(headLoop) * (loopRadius - (width / 2)),
      y: center.y + -1 * Math.sin(headLoop) * (loopRadius - (width / 2)) + tailOut,
    }
    const tailLoopInt = {
      x: center.x + Math.cos(tailLoop) * (loopRadius - (width / 2)),
      y: center.y + -1 * Math.sin(tailLoop) * (loopRadius - (width / 2)) + tailOut,
    }

    const path = `
      M
      ${tailLoopExt.x}
      ${tailLoopExt.y}

      A
      ${loopRadius + (width / 2)}
      ${loopRadius + (width / 2)}
      0 0 0
      ${headLoopExt.x}
      ${headLoopExt.y}

      L
      ${headOutExt.x}
      ${headOutExt.y}

      a
      ${(width / 2) / 6}
      ${(width / 2) / 6}
      0 0 0
      ${headOutInt.dx}
      ${headOutInt.dy}

      L
      ${headLoopInt.x}
      ${headLoopInt.y}

      A
      ${loopRadius - (width / 2)}
      ${loopRadius - (width / 2)}
      0 0 1
      ${tailLoopInt.x}
      ${tailLoopInt.y}

      A
      ${(width / 2) / 6}
      ${(width / 2) / 6}
      0 0 0
      ${tailLoopExt.x}
      ${tailLoopExt.y}
    `

    return path
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
