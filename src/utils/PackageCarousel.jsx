import React from 'react';
import {
  FormControl,
  RadioGroup,
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import { Check, Close, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const PackageCarousel = ({ 
  selection, 
  selectedPackages, 
  handlePackageSelect, 
  formatPrice 
}) => {
  return (
    <FormControl component="fieldset" fullWidth>
      <RadioGroup
        value={selectedPackages[selection.id] || ""}
        onChange={(e) => {
          const packageQuote = selection.package_quotes.find((p) => p.id === e.target.value);
          if (packageQuote) {
            handlePackageSelect(selection.id, packageQuote);
          }
        }}
      >
        <Box sx={{ position: 'relative', px: { xs: 2, sm: 4 } }}>
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={20}
            slidesPerView={3}
            navigation={{
              prevEl: `.swiper-button-prev-${selection.id}`,
              nextEl: `.swiper-button-next-${selection.id}`,
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true,
              el: `.swiper-pagination-${selection.id}`,
            }}
          >
            {selection.package_quotes.map((packageQuote) => (
              <SwiperSlide key={packageQuote.id}>
                <Card
                  variant="outlined"
                  sx={{
                    cursor: "pointer",
                    border:
                      selectedPackages[selection.id] === packageQuote.id
                        ? "2px solid #42bd3f"
                        : "1px solid #e0e0e0",
                    bgcolor:
                      selectedPackages[selection.id] === packageQuote.id
                        ? "#f8fff8"
                        : "white",
                    "&:hover": { 
                      borderColor: "#42bd3f",
                      transform: "translateY(-4px)",
                      boxShadow: "0 8px 24px rgba(66, 189, 63, 0.15)",
                    },
                    borderRadius: 3,
                    height: "100%",
                    minHeight: { xs: 280, sm: 320, md: 350 },
                    maxWidth:300,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "all 0.3s ease-in-out",
                    boxShadow: selectedPackages[selection.id] === packageQuote.id 
                      ? "0 4px 20px rgba(66, 189, 63, 0.2)" 
                      : "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                  onClick={() => handlePackageSelect(selection.id, packageQuote)}
                >
                  <CardContent sx={{ 
                    p: { xs: 2, sm: 3 }, 
                    textAlign: "center",
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}>
                    {/* Header */}
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      sx={{ 
                        fontSize: { xs: "1.1rem", sm: "1.3rem", md: "1.4rem" },
                        mb: 2,
                        color: selectedPackages[selection.id] === packageQuote.id ? "#42bd3f" : "text.primary"
                      }}
                    >
                      {packageQuote.package_name}
                    </Typography>

                    {/* Price */}
                    <Typography
                      variant="h4"
                      sx={{
                        color: "#42bd3f",
                        fontWeight: 700,
                        mb: 3,
                        fontSize: { xs: "1.8rem", sm: "2rem", md: "2.2rem" },
                      }}
                    >
                      ${formatPrice(packageQuote.total_price)}
                    </Typography>

                    {/* Features List */}
                    <Box textAlign="left" sx={{ flexGrow: 1 }}>
                      {[
                        ...(packageQuote.included_features_details || []).map((f) => ({
                          ...f,
                          included: true,
                        })),
                        ...(packageQuote.excluded_features_details || []).map((f) => ({
                          ...f,
                          included: false,
                        })),
                      ].map((feature) => (
                        <Box key={feature.id} display="flex" alignItems="center" mb={1}>
                          {feature.included ? (
                            <Check sx={{ fontSize: { xs: 16, sm: 18 }, color: "#42bd3f", mr: 1, flexShrink: 0 }} />
                          ) : (
                            <Close sx={{ fontSize: { xs: 16, sm: 18 }, color: "#9e9e9e", mr: 1, flexShrink: 0 }} />
                          )}
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: { xs: "0.8rem", sm: "0.85rem", md: "0.9rem" },
                              color: feature.included ? "text.primary" : "text.disabled",
                              fontWeight: feature.included ? 500 : 400,
                              overflowWrap: "break-word",
                              wordWrap: "break-word",
                              flexShrink: 1,
                              minWidth: 0,
                              lineHeight: 1.4,
                            }}
                          >
                            {feature.name}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom Navigation Buttons - Only show if more than one slide */}
          {selection.package_quotes.length > 1 && (
            <>
              <IconButton
                className={`swiper-button-prev-${selection.id}`}
                sx={{
                  position: 'absolute',
                  left: { xs: -8, sm: -16 },
                  top: '45%',
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                  bgcolor: 'white',
                  boxShadow: 2,
                  '&:hover': {
                    bgcolor: '#f5f5f5',
                  },
                  width: 44,
                  height: 44,
                  display: { xs: 'none', sm: 'flex' },
                }}
              >
                <ChevronLeft />
              </IconButton>

              <IconButton
                className={`swiper-button-next-${selection.id}`}
                sx={{
                  position: 'absolute',
                  right: { xs: -8, sm: -16 },
                  top: '45%',
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                  bgcolor: 'white',
                  boxShadow: 2,
                  '&:hover': {
                    bgcolor: '#f5f5f5',
                  },
                  width: 44,
                  height: 44,
                  display: { xs: 'none', sm: 'flex' },
                }}
              >
                <ChevronRight />
              </IconButton>
            </>
          )}

          {/* Custom Pagination - Only show if more than one slide */}
          {selection.package_quotes.length > 1 && (
            <Box 
              className={`swiper-pagination-${selection.id}`}
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                mt: 2,
                '& .swiper-pagination-bullet': {
                  backgroundColor: '#42bd3f',
                  opacity: 0.3,
                },
                '& .swiper-pagination-bullet-active': {
                  opacity: 1,
                },
              }} 
            />
          )}
        </Box>
      </RadioGroup>
    </FormControl>
  );
};

export default PackageCarousel;