/*
 * Copyright (c) 2002-2017 "Neo4j, Inc,"
 * Network Engine for Objects in Lund AB [http://neotechnology.com]
 *
 * This file is part of Neo4j.
 *
 * Neo4j is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { connect } from 'preact-redux'
import { executeCommand } from 'shared/modules/commands/commandsDuck'
import { withBus } from 'preact-suber'
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerSection,
  DrawerSectionBody,
  DrawerSubHeader
} from 'browser-components/drawer'
import {
  StyledSetting,
  StyledSettingLabel,
  StyledCustomTextInput,
  ExecCustomButton
} from './styled'

const placeholder = '___VAL___'
const placeholderRegExp = new RegExp(placeholder, 'g')

const visualQueries = [
  {
    title: 'Personas',
    settings: [
      {
        personaNif: {
          displayName: 'NIF persona física o jurídica',
          tooltip: 'NIF de la persona física o jurídica',
          query: `MATCH (n:PERSONA_FISICA) WHERE n.ID_NIF = '${placeholder}' RETURN n UNION MATCH (n:PERSONA_FISICA) WHERE n.ID_NIF_COMPLETO='${placeholder}' RETURN n UNION MATCH (n:PERSONA_JURIDICA) WHERE n.ID_NIF = '${placeholder}' RETURN n UNION MATCH (n:PERSONA_JURIDICA) WHERE n.ID_NIF_COMPLETO='${placeholder}' RETURN n`
        }
      }
    ]
  },
  {
    title: 'Fincas',
    settings: [
      {
        fincaIdRegistro: {
          displayName: 'ID finca',
          tooltip: 'Identificador de la finca en la tabla de catastro',
          query: `MATCH (n:FINCA) WHERE n.ID_FINCA = ${placeholder} RETURN n`
        }
      }
    ]
  }
]

export const Custom = ({ settings, onExecClick = () => {} }) => {
  if (!settings) return null
  const mappedSettings = visualQueries.map((visualSetting, i) => {
    const title = <DrawerSubHeader>{visualSetting.title}</DrawerSubHeader>
    const mapSettings = visualSetting.settings.map((visualQueryObj, i) => {
      const visualQuery = Object.keys(visualQueryObj)[0]
      const visual = visualQueryObj[visualQuery].displayName
      const tooltip = visualQueryObj[visualQuery].tooltip || ''
      const query = visualQueryObj[visualQuery].query

      if (
        !visualQueryObj[visualQuery].type ||
        visualQueryObj[visualQuery].type === 'input'
      ) {
        return (
          <StyledSetting key={i}>
            <StyledSettingLabel title={tooltip}>{visual}</StyledSettingLabel>
            <br />
            <StyledCustomTextInput
              id={visualQuery}
              title={[tooltip]}
              className={visualQuery}
              onKeyUp={event => {
                event.preventDefault()
                if (event.keyCode === 13) {
                  onExecClick(query, event.target.value)
                }
              }}
            />
            <ExecCustomButton
              onClick={event => {
                onExecClick(
                  query,
                  event.target.parentNode.previousElementSibling.value
                )
              }}
            />
          </StyledSetting>
        )
      }
    })
    return (
      <div>
        {title}
        {mapSettings}
      </div>
    )
  })

  return (
    <Drawer id='custom-queries'>
      <DrawerHeader>Custom queries</DrawerHeader>
      <DrawerBody>
        <DrawerSection>
          <DrawerSectionBody>{mappedSettings}</DrawerSectionBody>
        </DrawerSection>
      </DrawerBody>
    </Drawer>
  )
}

const mapStateToProps = state => {
  return {
    settings: state.settings
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onExecClick: (cmd, arg) => {
      cmd = cmd.replace(placeholderRegExp, arg)
      const action = executeCommand(cmd)
      ownProps.bus.send(action.type, action)
    }
  }
}

export default withBus(connect(mapStateToProps, mapDispatchToProps)(Custom))
