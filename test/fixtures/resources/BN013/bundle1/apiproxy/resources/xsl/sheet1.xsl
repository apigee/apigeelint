<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:output method="xml"
              encoding="utf-8"
              indent="yes"
              xslt:indent-amount="2" xmlns:xslt="http://xml.apache.org/xslt" />
  <xsl:strip-space elements="*"/>

  <!-- these are parameters set in the XSL Policy config -->
  <xsl:param name="base_location" select="''"/>

  <xsl:template match="/">
    <root>
      <xsl:apply-templates select="root/procedures/procedureId" />
    </root>
  </xsl:template>

  <xsl:template match="procedureId">
    <xsl:variable name="location" select="concat($base_location, normalize-space(./text()))"/>
    <xsl:variable name="xdoc" select="document($location)"/>
    <xsl:text>&#xa;</xsl:text>
    <xsl:comment><xsl:value-of select='concat(" ",$location," ")'/></xsl:comment>
    <xsl:text>&#xa;</xsl:text>
    <xsl:copy-of select="$xdoc/root/procedureDetails"/>
  </xsl:template>

</xsl:stylesheet>
