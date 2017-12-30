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
const placeholderCalle = '___VALCALLE___'
const placeholderMunicipio = '___VALMUNICIPIO___'
const placeholderCalleRegExp = new RegExp(placeholderCalle, 'g')
const placeholderMunicipioRegExp = new RegExp(placeholderMunicipio, 'g')

const visualQueries = [
  {
    title: 'Personas',
    settings: [
      {
        personaNif: {
          displayName: 'NIF persona física o jurídica',
          tooltip: 'NIF de la persona física o jurídica',
          query: `// Persona con NIF ${placeholder} \nMATCH (n:PERSONA_FISICA) WHERE n.ID_NIF = '${placeholder}' RETURN n UNION MATCH (n:PERSONA_FISICA) WHERE n.ID_NIF_COMPLETO='${placeholder}' RETURN n UNION MATCH (n:PERSONA_JURIDICA) WHERE n.ID_NIF = '${placeholder}' RETURN n UNION MATCH (n:PERSONA_JURIDICA) WHERE n.ID_NIF_COMPLETO='${placeholder}' RETURN n`
        }
      },
      {
        personaNombre: {
          displayName: 'Nombre persona física o jurídica',
          tooltip: 'Nombre de la persona física o jurídica por LIKE',
          query: `// Persona con Nombre ${placeholder} \nMATCH (n:PERSONA_FISICA) WHERE n.AT_NOMBRE =~ '.*${placeholder}.*' RETURN n UNION MATCH (n:PERSONA_JURIDICA) WHERE n.AT_NOMBRE =~ '.*${placeholder}.*' RETURN n`
        }
      }
    ]
  },
  {
    title: 'Locales',
    settings: [
      {
        direccionIdCatastro: {
          displayName: 'ID local catastro',
          tooltip: 'Identificador del local en la tabla de catastro',
          query: `// Local con ID_CATASTRO_PK ${placeholder} \nMATCH (n:LOCAL) WHERE n.ID_CATASTRO_PK = '${placeholder}' RETURN n`
        }
      }
    ]
  }
]

export const Custom = ({
  settings,
  onExecClick = () => {},
  onExecClickDireccion = () => {}
}) => {
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
                event.target.value = event.target.value.toUpperCase()
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

  const direccionTitle = (
    <DrawerSubHeader>Locales y Direcciones</DrawerSubHeader>
  )
  const direccionSettings = (() => {
    const tooltipCalle = 'Calle por LIKE'
    const tooltipMunicipio = 'Municipio por LIKE'
    const query = `// Local con calle ${placeholderCalle} y municipio ${placeholderMunicipio}\nMATCH (n:LOCAL) WHERE n.AT_VIA =~ '.*${placeholderCalle}.*' AND n.DE_MUNICIPIO =~ '.*${placeholderMunicipio}.*' RETURN n.ID_CATASTRO_PK as ID, n.ID_SN_LOCAL_PRINCIPA AS LOCAL_PRINCIPAL, n.DE_MUNICIPIO AS MUNICIPIO, n.AT_VIA AS VIA, n.AT_PORTAL AS PORTAL, n.AT_ESCALERA as ESCALERA, n.AT_PLANTA AS PLANTA, n.AT_MANO AS MANO ORDER BY MUNICIPIO, VIA, PORTAL, ESCALERA, PLANTA, MANO`
    return (
      <StyledSetting key='1000'>
        <StyledSettingLabel title={tooltipCalle}>Calle</StyledSettingLabel>
        <br />
        <StyledCustomTextInput
          id='calle'
          title={[tooltipCalle]}
          className='idCalle'
          onKeyUp={event => {
            event.target.value = event.target.value.toUpperCase()
            event.preventDefault()
            if (event.keyCode === 13) {
              onExecClickDireccion(
                query,
                event.target.value,
                event.target.nextElementSibling.nextElementSibling
                  .nextElementSibling.value
              )
            }
          }}
        />
        <StyledSettingLabel title={tooltipMunicipio}>
          Municipio
        </StyledSettingLabel>
        <br />
        <StyledCustomTextInput
          id='municipio'
          title={[tooltipMunicipio]}
          className='idMunicipio'
          onKeyUp={event => {
            event.target.value = event.target.value.toUpperCase()
            event.preventDefault()
            if (event.keyCode === 13) {
              onExecClickDireccion(
                query,
                event.target.previousElementSibling.previousElementSibling
                  .previousElementSibling.value,
                event.target.value
              )
            }
          }}
        />
        <ExecCustomButton
          onClick={event => {
            onExecClickDireccion(
              query,
              event.target.parentElement.previousElementSibling
                .previousElementSibling.previousElementSibling
                .previousElementSibling.value,
              event.target.parentNode.previousElementSibling.value
            )
          }}
        />
      </StyledSetting>
    )
  })()

  return (
    <Drawer id='custom-queries'>
      <DrawerHeader>Custom queries</DrawerHeader>
      <DrawerBody>
        <DrawerSection>
          <DrawerSectionBody>
            {mappedSettings}
            <div>
              {direccionTitle}
              {direccionSettings}
            </div>
          </DrawerSectionBody>
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
    },
    onExecClickDireccion: (cmd, calle, municipio) => {
      cmd = cmd.replace(placeholderCalleRegExp, calle)
      cmd = cmd.replace(placeholderMunicipioRegExp, municipio)
      const action = executeCommand(cmd)
      ownProps.bus.send(action.type, action)
    }
  }
}

export default withBus(connect(mapStateToProps, mapDispatchToProps)(Custom))
